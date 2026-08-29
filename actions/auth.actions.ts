"use server";

import { redirect } from "next/navigation";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createUserSession, destroyCurrentSession, getCurrentUser } from "@/lib/auth/session";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } from "@/schemas/auth.schema";
import { sendEmail } from "@/lib/email";
import { welcomeEmail, passwordResetEmail } from "@/emails/templates";
import { logAudit } from "@/lib/audit";
import { mergeGuestCart } from "@/services/cart.service";

export interface ActionResult {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

export async function registerAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = registerSchema.safeParse({
    ...raw,
    acceptTerms: raw.acceptTerms === "on" || raw.acceptTerms === "true",
    acceptPrivacy: raw.acceptPrivacy === "on" || raw.acceptPrivacy === "true",
    marketingOptIn: raw.marketingOptIn === "on" || raw.marketingOptIn === "true",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { success: false, message: "Verifique os campos destacados.", fieldErrors };
  }

  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existing) {
    return {
      success: false,
      message: "Este e-mail já está cadastrado.",
      fieldErrors: { email: "E-mail já cadastrado" },
    };
  }

  const passwordHash = await hashPassword(data.password);
  const now = new Date();

  const user = await prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      fullName: `${data.firstName} ${data.lastName}`,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
      document: data.document || null,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      passwordHash,
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
      marketingOptIn: data.marketingOptIn,
      notificationPrefs: {
        create: { newsletter: data.marketingOptIn },
      },
    },
  });

  await prisma.cart.create({ data: { userId: user.id } });

  await createUserSession(user.id);
  await logAudit({ userId: user.id, action: "user.register" });

  await sendEmail({ to: user.email, ...welcomeEmail(user.firstName) });

  // Merge guest cart items (sent from client localStorage) if provided
  const guestCartRaw = formData.get("guestCart");
  if (typeof guestCartRaw === "string" && guestCartRaw) {
    try {
      const items = JSON.parse(guestCartRaw);
      if (Array.isArray(items)) await mergeGuestCart(user.id, items);
    } catch {
      /* ignore malformed guest cart */
    }
  }

  return { success: true };
}

export async function loginAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, message: "Informe e-mail e senha válidos." };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { success: false, message: "E-mail ou senha incorretos." };
  }

  if (user.blocked) {
    return { success: false, message: "Sua conta está bloqueada. Entre em contato com o suporte." };
  }

  await createUserSession(user.id);
  await logAudit({ userId: user.id, action: "user.login" });

  const guestCartRaw = formData.get("guestCart");
  if (typeof guestCartRaw === "string" && guestCartRaw) {
    try {
      const items = JSON.parse(guestCartRaw);
      if (Array.isArray(items)) await mergeGuestCart(user.id, items);
    } catch {
      /* ignore */
    }
  }

  return { success: true };
}

export async function logoutAction() {
  const user = await getCurrentUser();
  if (user) await logAudit({ userId: user.id, action: "user.logout" });
  await destroyCurrentSession();
  redirect("/");
}

export async function forgotPasswordAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { success: false, message: "Informe um e-mail válido." };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });

  // Always respond with success to avoid leaking which emails are registered.
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/redefinir-senha?token=${token}`;
    await sendEmail({ to: user.email, ...passwordResetEmail(user.firstName, resetUrl) });
    await logAudit({ userId: user.id, action: "user.forgot_password" });
  }

  return {
    success: true,
    message: "Se este e-mail estiver cadastrado, enviaremos um link de recuperação.",
  };
}

export async function resetPasswordAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const tokenHash = crypto.createHash("sha256").update(parsed.data.token).digest("hex");
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return { success: false, message: "Link inválido ou expirado. Solicite um novo." };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
    prisma.session.deleteMany({ where: { userId: resetToken.userId } }), // invalidate all sessions
  ]);

  await logAudit({ userId: resetToken.userId, action: "user.reset_password" });

  return { success: true, message: "Senha redefinida com sucesso. Faça login." };
}

export async function changePasswordAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Não autenticado." };

  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return { success: false, message: "Senha atual incorreta." };

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await logAudit({ userId: user.id, action: "user.change_password" });

  return { success: true, message: "Senha alterada com sucesso." };
}

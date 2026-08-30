import "server-only";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";
import type { PlatformAdmin } from "@prisma/client";

// ---------------------------------------------------------------------------
// Fase 3 — sessão do Super Admin da Hello Inova (PlatformAdmin).
// Totalmente separada da sessão de admin de loja (lib/auth/admin-session.ts):
// cookie próprio, sem nenhuma noção de companyId/tenant — quem loga aqui
// enxerga e administra TODAS as empresas da plataforma, não uma só. Por
// isso este módulo nunca chama enterTenant(); os modelos que ele consulta
// (Company, Plan, Subscription, SubscriptionInvoice, PlatformAdmin) não
// fazem parte de TENANT_SCOPED_MODELS em lib/db.ts.
// ---------------------------------------------------------------------------

const PLATFORM_COOKIE = "hm_platform_session";
const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret-change-in-production";
const SESSION_DURATION = "7d";

export interface PlatformTokenPayload {
  sub: string;
  role: string;
}

export async function createPlatformSession(admin: PlatformAdmin) {
  const token = jwt.sign({ sub: admin.id, role: admin.role }, JWT_SECRET, {
    expiresIn: SESSION_DURATION,
  });

  const cookieStore = await cookies();
  cookieStore.set(PLATFORM_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getCurrentPlatformAdmin(): Promise<PlatformAdmin | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PLATFORM_COOKIE)?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET) as PlatformTokenPayload;
    const admin = await prisma.platformAdmin.findUnique({ where: { id: payload.sub } });
    if (!admin || !admin.active) return null;
    return admin;
  } catch {
    return null;
  }
}

export async function requirePlatformAdmin(): Promise<PlatformAdmin> {
  const admin = await getCurrentPlatformAdmin();
  if (!admin) throw new Error("UNAUTHENTICATED");
  return admin;
}

export async function requirePlatformOwner(): Promise<PlatformAdmin> {
  const admin = await requirePlatformAdmin();
  if (admin.role !== "OWNER") throw new Error("FORBIDDEN");
  return admin;
}

export async function destroyPlatformSession() {
  const cookieStore = await cookies();
  cookieStore.delete(PLATFORM_COOKIE);
}

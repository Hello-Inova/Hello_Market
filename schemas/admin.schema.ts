import { z } from "zod";

export const couponSchema = z.object({
  code: z.string().min(3, "Informe o código do cupom").max(40).transform((v) => v.toUpperCase().trim()),
  description: z.string().optional().or(z.literal("")),
  type: z.enum(["PERCENTAGE", "FIXED", "FREE_SHIPPING"]),
  value: z.number().min(0),
  minOrderValue: z.number().min(0).optional().nullable(),
  maxDiscountValue: z.number().min(0).optional().nullable(),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
  usageLimit: z.number().int().min(1).optional().nullable(),
  usageLimitPerUser: z.number().int().min(1).default(1),
  allowedCategoryIds: z.array(z.string()).default([]),
  allowedProductIds: z.array(z.string()).default([]),
  status: z.enum(["ACTIVE", "INACTIVE", "EXPIRED"]).default("ACTIVE"),
});

export const bannerSchema = z.object({
  title: z.string().min(2, "Informe o título").max(160),
  subtitle: z.string().optional().or(z.literal("")),
  imageUrlDesktop: z.string().url("Informe uma URL de imagem válida"),
  imageUrlMobile: z.string().url().optional().or(z.literal("")),
  buttonText: z.string().optional().or(z.literal("")),
  link: z.string().optional().or(z.literal("")),
  position: z.string().default("home_hero"),
  order: z.number().int().default(0),
  active: z.boolean().default(true),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
});

export const pageSchema = z.object({
  slug: z.string().min(2, "Informe o slug").max(120),
  title: z.string().min(2, "Informe o título").max(200),
  content: z.string().min(1, "Informe o conteúdo"),
  seoTitle: z.string().optional().or(z.literal("")),
  seoDescription: z.string().optional().or(z.literal("")),
  published: z.boolean().default(true),
});

export const adminUserSchema = z.object({
  name: z.string().min(2, "Informe o nome").max(120),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Mínimo de 8 caracteres").optional().or(z.literal("")),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "GERENTE", "OPERADOR"]),
  permissions: z.array(z.string()).default([]),
  active: z.boolean().default(true),
});

// Troca de e-mail em autoatendimento — mesmo padrão de changeEmailSchema em
// auth.schema.ts, usado pelo cliente final na loja.
export const changeAdminEmailSchema = z.object({
  newEmail: z.string().email("E-mail inválido"),
  currentPassword: z.string().min(1, "Informe a senha atual"),
});

// Alteração de senha em autoatendimento — o próprio admin logado trocando a
// PRÓPRIA senha (mesmo padrão de changePasswordSchema em auth.schema.ts e de
// changePlatformPasswordSchema em platform.schema.ts). Diferente de
// adminUserSchema acima, que é outro admin com "users.manage" definindo a
// senha de um terceiro sem precisar da senha atual.
export const changeAdminPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual"),
    newPassword: z
      .string()
      .min(8, "A senha deve ter no mínimo 8 caracteres")
      .regex(/[a-z]/, "A senha deve conter uma letra minúscula")
      .regex(/[A-Z]/, "A senha deve conter uma letra maiúscula")
      .regex(/[0-9]/, "A senha deve conter um número"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export const stockAdjustSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional().nullable(),
  delta: z.number().int().refine((v) => v !== 0, "Informe uma quantidade diferente de zero"),
  reason: z.string().min(2, "Informe o motivo do ajuste"),
});

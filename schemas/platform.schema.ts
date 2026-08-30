import { z } from "zod";
import { RESERVED_COMPANY_SLUGS } from "@/lib/tenant/resolve";

const slugSchema = z
  .string()
  .min(2, "Mínimo de 2 caracteres")
  .max(60)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífen")
  .refine((slug) => !RESERVED_COMPANY_SLUGS.has(slug), "Este identificador é reservado, escolha outro");

export const createCompanySchema = z.object({
  name: z.string().min(2, "Informe o nome da empresa").max(120),
  slug: slugSchema,
  planId: z.string().min(1, "Selecione um plano"),
  adminName: z.string().min(2, "Informe o nome do responsável").max(120),
  adminEmail: z.string().email("E-mail inválido"),
  adminPassword: z
    .string()
    .min(8, "A senha deve ter no mínimo 8 caracteres")
    .regex(/[a-z]/, "A senha deve conter uma letra minúscula")
    .regex(/[A-Z]/, "A senha deve conter uma letra maiúscula")
    .regex(/[0-9]/, "A senha deve conter um número"),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use um hexadecimal válido, ex: #16a34a");

// Mantido em sincronia manualmente com as fontes carregadas via next/font em
// app/layout.tsx (CURATED_FONT_VARIABLES) — `cssVar` é a variável CSS que
// app/loja/[companySlug]/layout.tsx usa para sobrescrever
// --font-sans-active (ver globals.css) de acordo com o `fontFamily`
// escolhido para cada empresa.
export const CURATED_FONTS = [
  { value: "geist", label: "Geist (padrão)", cssVar: "--font-geist-sans" },
  { value: "dm-sans", label: "DM Sans", cssVar: "--font-dm-sans" },
  { value: "inter", label: "Inter", cssVar: "--font-inter" },
  { value: "poppins", label: "Poppins", cssVar: "--font-poppins" },
  { value: "roboto", label: "Roboto", cssVar: "--font-roboto" },
  { value: "montserrat", label: "Montserrat", cssVar: "--font-montserrat" },
  { value: "playfair", label: "Playfair Display", cssVar: "--font-playfair" },
] as const;

const fontFamilySchema = z.enum(CURATED_FONTS.map((f) => f.value) as [string, ...string[]]);

export const updateCompanySchema = z.object({
  name: z.string().min(2, "Informe o nome da empresa").max(120),
  legalName: z.string().max(160).optional().or(z.literal("")),
  document: z.string().max(30).optional().or(z.literal("")),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  status: z.enum(["TRIAL", "ACTIVE", "PAST_DUE", "SUSPENDED", "CANCELLED"]),
  primaryColor: hexColor,
  secondaryColor: hexColor,
  fontColor: hexColor,
  fontFamily: fontFamilySchema,
  logoUrl: z.string().max(500).optional().or(z.literal("")),
  faviconUrl: z.string().max(500).optional().or(z.literal("")),
});

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

// Subconjunto de updateCompanySchema usado no formulário de "Aparência" do
// admin de loja (Fase 4) — a própria empresa edita seu tema, mas não seus
// dados cadastrais/status, que ficam só com o Super Admin da plataforma.
export const updateCompanyThemeSchema = updateCompanySchema.pick({
  primaryColor: true,
  secondaryColor: true,
  fontColor: true,
  fontFamily: true,
  logoUrl: true,
  faviconUrl: true,
});

export type UpdateCompanyThemeInput = z.infer<typeof updateCompanyThemeSchema>;

// Troca de e-mail do PlatformAdmin — mesmo padrão de changeEmailSchema em
// schemas/auth.schema.ts. `PlatformAdmin.email` é @unique globalmente (não
// tem escopo de tenant), então a checagem de duplicidade pode usar
// findUnique normalmente.
export const changePlatformEmailSchema = z.object({
  newEmail: z.string().email("E-mail inválido"),
  currentPassword: z.string().min(1, "Informe a senha atual"),
});

export type ChangePlatformEmailInput = z.infer<typeof changePlatformEmailSchema>;

// Troca de senha do PlatformAdmin — mesmo formato de schemas/auth.schema.ts
// (changePasswordSchema), usado pelo cliente final na loja.
export const changePlatformPasswordSchema = z
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

export type ChangePlatformPasswordInput = z.infer<typeof changePlatformPasswordSchema>;

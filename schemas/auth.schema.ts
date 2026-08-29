import { z } from "zod";
import { isValidCpfCnpj, isValidPhone } from "@/lib/validators";

export const registerSchema = z
  .object({
    firstName: z.string().min(2, "Informe o nome").max(80),
    lastName: z.string().min(2, "Informe o sobrenome").max(80),
    email: z.string().email("E-mail inválido"),
    phone: z
      .string()
      .refine(isValidPhone, "Telefone inválido")
      .optional()
      .or(z.literal("")),
    document: z
      .string()
      .refine(isValidCpfCnpj, "CPF/CNPJ inválido")
      .optional()
      .or(z.literal("")),
    birthDate: z.string().optional().or(z.literal("")),
    password: z
      .string()
      .min(8, "A senha deve ter no mínimo 8 caracteres")
      .regex(/[a-z]/, "A senha deve conter uma letra minúscula")
      .regex(/[A-Z]/, "A senha deve conter uma letra maiúscula")
      .regex(/[0-9]/, "A senha deve conter um número"),
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, {
      message: "É necessário aceitar os Termos de Uso",
    }),
    acceptPrivacy: z.literal(true, {
      message: "É necessário aceitar a Política de Privacidade",
    }),
    marketingOptIn: z.boolean().optional().default(false),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z
      .string()
      .min(8, "A senha deve ter no mínimo 8 caracteres")
      .regex(/[a-z]/, "A senha deve conter uma letra minúscula")
      .regex(/[A-Z]/, "A senha deve conter uma letra maiúscula")
      .regex(/[0-9]/, "A senha deve conter um número"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
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

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).max(80),
  lastName: z.string().min(2).max(80),
  document: z.string().refine(isValidCpfCnpj, "CPF/CNPJ inválido").optional().or(z.literal("")),
  phone: z.string().refine(isValidPhone, "Telefone inválido").optional().or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

import { z } from "zod";

export const addressSchema = z.object({
  label: z.string().min(1, "Dê um nome para o endereço").max(60),
  type: z.enum(["RESIDENTIAL", "COMMERCIAL", "OTHER"]).default("RESIDENTIAL"),
  recipient: z.string().min(2, "Informe o destinatário").max(120),
  zipCode: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
  street: z.string().min(2, "Informe a rua").max(160),
  number: z.string().min(1, "Informe o número").max(20),
  complement: z.string().max(120).optional().or(z.literal("")),
  neighborhood: z.string().min(2, "Informe o bairro").max(120),
  city: z.string().min(2, "Informe a cidade").max(120),
  state: z.string().length(2, "Use a sigla do estado (ex: SP)"),
  country: z.string().default("Brasil"),
  reference: z.string().max(160).optional().or(z.literal("")),
  isDefault: z.boolean().optional().default(false),
});

export type AddressInput = z.infer<typeof addressSchema>;

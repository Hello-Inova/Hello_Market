import { z } from "zod";

export const applyCouponSchema = z.object({
  code: z.string().min(1, "Informe o código do cupom"),
});

export const calculateShippingSchema = z.object({
  zipCode: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
});

export const createOrderSchema = z.object({
  addressId: z.string().min(1, "Selecione um endereço de entrega"),
  shippingMethodId: z.string().min(1, "Selecione uma forma de entrega"),
  paymentMethod: z.enum(["PIX", "CREDIT_CARD", "BOLETO"]),
  installments: z.number().int().min(1).max(12).default(1),
  couponCode: z.string().optional(),
  customerNote: z.string().max(500).optional(),
  card: z
    .object({
      number: z.string().min(13).max(19),
      holderName: z.string().min(2),
      expiry: z.string().regex(/^\d{2}\/\d{2}$/),
      cvv: z.string().min(3).max(4),
    })
    .optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// Admin coupon CRUD validation lives in schemas/admin.schema.ts (couponSchema),
// used by actions/admin/coupon.actions.ts.

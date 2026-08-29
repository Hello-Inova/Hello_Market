import { z } from "zod";

export const reviewSchema = z.object({
  productId: z.string().min(1),
  orderId: z.string().optional().nullable(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional().or(z.literal("")),
  comment: z.string().max(2000).optional().or(z.literal("")),
  images: z.array(z.string().url()).max(6).default([]),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

export const cancellationRequestSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().min(3, "Informe o motivo"),
  note: z.string().max(1000).optional().or(z.literal("")),
});

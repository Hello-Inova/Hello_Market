import { z } from "zod";

export const productImageSchema = z.object({
  id: z.string().optional(),
  url: z.string().url("URL de imagem inválida"),
  altText: z.string().optional(),
  order: z.number().int().default(0),
  variantId: z.string().optional().nullable(),
});

export const productVariantSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1, "Informe o SKU da variação"),
  name: z.string().min(1, "Informe o nome da variação"),
  options: z.record(z.string(), z.string()),
  price: z.number().positive().optional().nullable(),
  compareAtPrice: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0).default(0),
  weightKg: z.number().positive().optional().nullable(),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  active: z.boolean().default(true),
});

export const productSchema = z.object({
  name: z.string().min(3, "Informe o nome do produto").max(200),
  slug: z.string().min(3).max(220).optional(),
  sku: z.string().min(1, "Informe o SKU").max(60),
  shortDescription: z.string().max(500).optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  price: z.number().positive("Informe um preço válido"),
  compareAtPrice: z.number().positive().optional().nullable(),
  costPrice: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0).default(0),
  minStock: z.number().int().min(0).default(5),
  weightKg: z.number().positive().optional().nullable(),
  heightCm: z.number().positive().optional().nullable(),
  widthCm: z.number().positive().optional().nullable(),
  lengthCm: z.number().positive().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]).default("ACTIVE"),
  featured: z.boolean().default(false),
  type: z.enum(["PHYSICAL", "DIGITAL"]).default("PHYSICAL"),
  seoTitle: z.string().optional().or(z.literal("")),
  seoDescription: z.string().optional().or(z.literal("")),
  images: z.array(productImageSchema).default([]),
  variants: z.array(productVariantSchema).default([]),
});

export type ProductInput = z.infer<typeof productSchema>;

export const categorySchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(140).optional(),
  description: z.string().optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
  seoTitle: z.string().optional().or(z.literal("")),
  seoDescription: z.string().optional().or(z.literal("")),
  status: z.boolean().default(true),
  order: z.number().int().default(0),
  parentId: z.string().optional().nullable(),
});

export const brandSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(140).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  status: z.boolean().default(true),
});

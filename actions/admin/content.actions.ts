"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/admin-session";
import { logAudit } from "@/lib/audit";
import { bannerSchema, pageSchema } from "@/schemas/admin.schema";
import { slugify } from "@/lib/utils";

export interface ActionResult {
  success: boolean;
  message?: string;
}

// ---------------------------------------------------------------------------
// Banners
// ---------------------------------------------------------------------------

export async function saveBannerContentAction(bannerId: string | null, raw: unknown): Promise<ActionResult> {
  const admin = await requirePermission("banners.manage");
  const parsed = bannerSchema.safeParse(raw);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const data = parsed.data;
  const payload = {
    title: data.title,
    subtitle: data.subtitle || null,
    imageUrlDesktop: data.imageUrlDesktop,
    imageUrlMobile: data.imageUrlMobile || null,
    buttonText: data.buttonText || null,
    link: data.link || null,
    position: data.position,
    order: data.order,
    active: data.active,
    startsAt: data.startsAt ? new Date(data.startsAt) : null,
    endsAt: data.endsAt ? new Date(data.endsAt) : null,
  };

  if (bannerId) {
    await prisma.banner.update({ where: { id: bannerId }, data: payload });
  } else {
    await prisma.banner.create({ data: payload });
  }

  await logAudit({ adminId: admin.id, action: bannerId ? "banner.update" : "banner.create", entity: "Banner", entityId: bannerId ?? undefined });
  revalidatePath(`/admin/${admin.companySlug}/banners`);
  revalidatePath(`/loja/${admin.companySlug}`);

  return { success: true };
}

export async function deleteBannerAction(bannerId: string): Promise<ActionResult> {
  const admin = await requirePermission("banners.manage");
  await prisma.banner.delete({ where: { id: bannerId } });
  await logAudit({ adminId: admin.id, action: "banner.delete", entity: "Banner", entityId: bannerId });
  revalidatePath(`/admin/${admin.companySlug}/banners`);
  revalidatePath(`/loja/${admin.companySlug}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Pages (CMS)
// ---------------------------------------------------------------------------

export async function savePageAction(pageId: string | null, raw: unknown): Promise<ActionResult> {
  const admin = await requirePermission("pages.manage");
  const parsed = pageSchema.safeParse(raw);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const data = parsed.data;
  const slug = slugify(data.slug);

  const existing = await prisma.page.findUnique({ where: { slug } });
  if (existing && existing.id !== pageId) {
    return { success: false, message: "Já existe uma página com esse slug." };
  }

  const payload = {
    slug,
    title: data.title,
    content: data.content,
    seoTitle: data.seoTitle || null,
    seoDescription: data.seoDescription || null,
    published: data.published,
  };

  if (pageId) {
    await prisma.page.update({ where: { id: pageId }, data: payload });
  } else {
    await prisma.page.create({ data: payload });
  }

  await logAudit({ adminId: admin.id, action: pageId ? "page.update" : "page.create", entity: "Page", entityId: pageId ?? undefined });
  revalidatePath(`/admin/${admin.companySlug}/paginas`);
  revalidatePath(`/loja/${admin.companySlug}/paginas/${slug}`);

  return { success: true };
}

export async function deletePageAction(pageId: string): Promise<ActionResult> {
  const admin = await requirePermission("pages.manage");
  const page = await prisma.page.delete({ where: { id: pageId } });
  await logAudit({ adminId: admin.id, action: "page.delete", entity: "Page", entityId: pageId });
  revalidatePath(`/admin/${admin.companySlug}/paginas`);
  revalidatePath(`/loja/${admin.companySlug}/paginas/${page.slug}`);
  return { success: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/admin-session";
import { logAudit } from "@/lib/audit";
import { updateSetting } from "@/services/settings.service";

export interface ActionResult {
  success: boolean;
  message?: string;
}

export async function updateStoreSettingsAction(raw: {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  cnpj: string;
  logoUrl: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  youtube: string;
  guestCheckout: boolean;
  minOrderValue: number;
  freeShippingThreshold: number;
}): Promise<ActionResult> {
  const admin = await requirePermission("settings.manage");

  await Promise.all([
    updateSetting("store.name", raw.name, "store"),
    updateSetting("store.email", raw.email, "store"),
    updateSetting("store.phone", raw.phone, "store"),
    updateSetting("store.whatsapp", raw.whatsapp, "store"),
    updateSetting("store.address", raw.address, "store"),
    updateSetting("store.cnpj", raw.cnpj, "store"),
    updateSetting("store.logoUrl", raw.logoUrl, "store"),
    updateSetting(
      "store.social",
      { instagram: raw.instagram, facebook: raw.facebook, tiktok: raw.tiktok, youtube: raw.youtube },
      "social"
    ),
    updateSetting(
      "store.checkout",
      {
        guestCheckout: raw.guestCheckout,
        minOrderValue: raw.minOrderValue,
        freeShippingThreshold: raw.freeShippingThreshold,
      },
      "checkout"
    ),
  ]);

  await logAudit({ adminId: admin.id, action: "settings.update", entity: "Setting" });
  revalidatePath("/admin/configuracoes");
  revalidatePath("/");

  return { success: true };
}

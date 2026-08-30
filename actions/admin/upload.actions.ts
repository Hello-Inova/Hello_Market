"use server";

import { requireAdmin, adminHasPermission } from "@/lib/auth/admin-session";
import { uploadFile } from "@/lib/storage";

export interface UploadActionResult {
  success: boolean;
  url?: string;
  message?: string;
}

// Usado tanto na aba "Imagens" do produto quanto na imagem de cada
// variação — aceita se o admin puder criar OU editar produtos, já que o
// upload acontece tanto num produto novo (ainda não salvo) quanto num já
// existente.
export async function uploadProductImageAction(formData: FormData): Promise<UploadActionResult> {
  const admin = await requireAdmin();
  if (!adminHasPermission(admin, "products.create") && !adminHasPermission(admin, "products.edit")) {
    return { success: false, message: "Você não tem permissão para enviar imagens de produtos." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: "Nenhum arquivo enviado." };
  }

  try {
    const result = await uploadFile(file, "products");
    return { success: true, url: result.url };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Falha ao enviar a imagem." };
  }
}

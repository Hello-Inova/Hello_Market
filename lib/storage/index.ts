import "server-only";
import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";

/**
 * Image/file storage abstraction.
 *
 * Every place in the system that stores an image persists only a URL string
 * in PostgreSQL — never binary data. Admins can either paste a URL directly,
 * or use "Enviar do computador" to upload a file, which calls `uploadFile`
 * below and turns the file into a URL automatically.
 *
 * Upload is implemented for Vercel Blob (the natural choice for a project
 * hosted on Vercel — no extra infrastructure, generous free tier) and
 * activates automatically as soon as a Blob store is connected to the
 * Vercel project (Vercel injects BLOB_READ_WRITE_TOKEN by itself — no need
 * to also set STORAGE_PROVIDER). Setting STORAGE_PROVIDER=cloudinary/r2
 * instead is left ready for activation: implement the upload in the
 * matching branch below using that provider's SDK when needed. Until any
 * provider is configured, upload throws a clear message asking the admin
 * to paste a URL instead — the app never becomes unusable for lack of
 * credentials, matching the same graceful-degradation pattern already used
 * for payments/e-mail/frete in this project.
 */

export interface UploadResult {
  url: string;
  provider: string;
}

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

export function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "Formato não suportado. Envie uma imagem JPG, PNG, WEBP, GIF ou AVIF.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `Imagem muito grande (máx. ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB).`;
  }
  return null;
}

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-+/g, "-")
    .slice(-80);
}

export async function uploadFile(file: File, folder = "products"): Promise<UploadResult> {
  const invalidReason = validateImageFile(file);
  if (invalidReason) throw new Error(invalidReason);

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  const provider = (process.env.STORAGE_PROVIDER || (blobToken ? "vercel-blob" : "url")).toLowerCase();

  switch (provider) {
    case "vercel-blob": {
      if (!blobToken) {
        throw new Error(
          "Upload de imagem ainda não configurado: conecte um Blob Store ao projeto na Vercel (Storage → Create Database → Blob) — o token é injetado automaticamente. Enquanto isso, use um link de imagem (URL)."
        );
      }
      const key = `${folder}/${randomUUID()}-${sanitizeFileName(file.name || "imagem")}`;
      const blob = await put(key, file, {
        access: "public",
        token: blobToken,
        addRandomSuffix: false,
        contentType: file.type,
      });
      return { url: blob.url, provider: "vercel-blob" };
    }
    case "cloudinary": {
      if (!process.env.CLOUDINARY_URL) {
        throw new Error("STORAGE_PROVIDER=cloudinary requer CLOUDINARY_URL.");
      }
      throw new Error(
        "Integração com Cloudinary pronta para ativação: instale o SDK cloudinary e implemente o upload em lib/storage/index.ts."
      );
    }
    case "r2": {
      if (!process.env.R2_ACCESS_KEY_ID) {
        throw new Error("STORAGE_PROVIDER=r2 requer R2_ACCOUNT_ID/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY/R2_BUCKET.");
      }
      throw new Error(
        "Integração com Cloudflare R2 pronta para ativação: instale @aws-sdk/client-s3 (compatível com R2) e implemente o upload em lib/storage/index.ts."
      );
    }
    default:
      throw new Error(
        "Upload de imagem indisponível: nenhum provedor de armazenamento configurado. Use um link de imagem (URL), ou conecte um Blob Store ao projeto na Vercel para habilitar o envio direto do computador."
      );
  }
}

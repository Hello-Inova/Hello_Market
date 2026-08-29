/**
 * Image/file storage abstraction.
 *
 * Every place in the system that stores an image persists only a URL string
 * in PostgreSQL — never binary data. By default admins add images via URL
 * (STORAGE_PROVIDER=url, the zero-config default). To enable direct upload,
 * set STORAGE_PROVIDER to "vercel-blob" | "cloudinary" | "r2" and the
 * matching credentials in .env — then implement `uploadFile` below using
 * that provider's SDK. The rest of the app only ever calls `uploadFile` /
 * `isValidImageUrl`, so switching providers never touches UI or business code.
 */

export interface UploadResult {
  url: string;
  provider: string;
}

export function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function uploadFile(_file: File): Promise<UploadResult> {
  const provider = (process.env.STORAGE_PROVIDER || "url").toLowerCase();

  switch (provider) {
    case "vercel-blob": {
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        throw new Error(
          "STORAGE_PROVIDER=vercel-blob requer BLOB_READ_WRITE_TOKEN. Configure a variável de ambiente ou instale @vercel/blob e implemente o upload aqui."
        );
      }
      throw new Error(
        "Integração com Vercel Blob pronta para ativação: instale @vercel/blob e implemente o upload em lib/storage/index.ts."
      );
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
        "Upload de arquivo desabilitado no modo STORAGE_PROVIDER=url. Utilize um link de imagem (URL) no formulário, ou configure vercel-blob/cloudinary/r2."
      );
  }
}

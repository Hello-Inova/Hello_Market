import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Upload de imagem de produto (Server Action com multipart/form-data)
    // — o padrão do Next.js é 1MB, pequeno demais para uma foto. Cobre o
    // limite de 5MB (MAX_UPLOAD_BYTES em lib/storage/index.ts) com margem
    // para o overhead do multipart.
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
    qualities: [65, 75, 90],
  },
};

export default nextConfig;

import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { BannerManager } from "@/components/admin/banner-manager";

export const metadata: Metadata = { title: "Banners" };

export default async function AdminBannersPage() {
  const banners = await prisma.banner.findMany({ orderBy: [{ position: "asc" }, { order: "asc" }] });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Banners</h1>
      <BannerManager
        banners={banners.map((b) => ({
          id: b.id,
          title: b.title,
          subtitle: b.subtitle,
          imageUrlDesktop: b.imageUrlDesktop,
          imageUrlMobile: b.imageUrlMobile,
          buttonText: b.buttonText,
          link: b.link,
          position: b.position,
          order: b.order,
          active: b.active,
        }))}
      />
    </div>
  );
}

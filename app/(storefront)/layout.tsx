import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { getCurrentUser } from "@/lib/auth/session";
import { getCartWithDetails } from "@/services/cart.service";
import { getStoreSettings } from "@/services/settings.service";
import { prisma } from "@/lib/db";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const [user, settings, categories] = await Promise.all([
    getCurrentUser(),
    getStoreSettings(),
    prisma.category.findMany({
      where: { status: true, parentId: null },
      orderBy: { order: "asc" },
      select: { name: true, slug: true },
      take: 8,
    }),
  ]);

  const cart = user ? await getCartWithDetails(user.id) : null;
  const cartCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  return (
    <>
      <Header
        user={user ? { fullName: user.fullName, email: user.email } : null}
        cartCount={cartCount}
        categories={categories}
        storeName={settings.name}
        logoUrl={settings.logoUrl}
      />
      <main className="flex-1">{children}</main>
      <Footer
        storeName={settings.name}
        email={settings.email}
        phone={settings.phone}
        address={settings.address}
        social={settings.social}
      />
    </>
  );
}

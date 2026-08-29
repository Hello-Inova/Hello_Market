import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { AddressManager } from "@/components/account/address-manager";

export const metadata: Metadata = { title: "Meus endereços" };

export default async function AddressesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Meus endereços</h1>
      <AddressManager addresses={addresses} />
    </div>
  );
}

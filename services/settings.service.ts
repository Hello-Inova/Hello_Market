import "server-only";
import { prisma } from "@/lib/db";

export interface StoreSettings {
  name: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  social: { instagram?: string; facebook?: string; tiktok?: string; youtube?: string };
  checkout: { guestCheckout: boolean; minOrderValue: number; freeShippingThreshold: number };
}

const DEFAULTS: StoreSettings = {
  name: "Hello Market",
  logoUrl: null,
  faviconUrl: null,
  cnpj: null,
  email: "contato@hellomarket.com.br",
  phone: "(11) 4000-0000",
  whatsapp: "(11) 90000-0000",
  address: "Av. Paulista, 1000 — São Paulo, SP",
  social: {
    instagram: "https://instagram.com/hellomarket",
    facebook: "https://facebook.com/hellomarket",
  },
  checkout: { guestCheckout: false, minOrderValue: 0, freeShippingThreshold: 299 },
};

export async function getStoreSettings(): Promise<StoreSettings> {
  const rows = await prisma.setting.findMany({ where: { group: "store" } });
  const map = new Map(rows.map((r) => [r.key, r.value]));

  return {
    name: (map.get("store.name") as string) ?? DEFAULTS.name,
    logoUrl: (map.get("store.logoUrl") as string) ?? DEFAULTS.logoUrl,
    faviconUrl: (map.get("store.faviconUrl") as string) ?? DEFAULTS.faviconUrl,
    cnpj: (map.get("store.cnpj") as string) ?? DEFAULTS.cnpj,
    email: (map.get("store.email") as string) ?? DEFAULTS.email,
    phone: (map.get("store.phone") as string) ?? DEFAULTS.phone,
    whatsapp: (map.get("store.whatsapp") as string) ?? DEFAULTS.whatsapp,
    address: (map.get("store.address") as string) ?? DEFAULTS.address,
    social: (map.get("store.social") as StoreSettings["social"]) ?? DEFAULTS.social,
    checkout: (map.get("store.checkout") as StoreSettings["checkout"]) ?? DEFAULTS.checkout,
  };
}

export async function updateSetting(key: string, value: unknown, group: string) {
  await prisma.setting.upsert({
    where: { key },
    update: { value: value as never },
    create: { key, value: value as never, group },
  });
}

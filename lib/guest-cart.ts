"use client";

// Guest (non-authenticated) cart, persisted in localStorage and synced to the
// database cart automatically after login/register (section 20).

export interface GuestCartItem {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

const KEY = "hm_guest_cart";

export function readGuestCart(): GuestCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GuestCartItem[]) : [];
  } catch {
    return [];
  }
}

export function writeGuestCart(items: GuestCartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("hm_guest_cart_change"));
}

export function addToGuestCart(item: GuestCartItem) {
  const items = readGuestCart();
  const existing = items.find(
    (i) => i.productId === item.productId && (i.variantId ?? null) === (item.variantId ?? null)
  );
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    items.push(item);
  }
  writeGuestCart(items);
  return items;
}

export function updateGuestCartQuantity(productId: string, variantId: string | null | undefined, quantity: number) {
  let items = readGuestCart();
  if (quantity <= 0) {
    items = items.filter((i) => !(i.productId === productId && (i.variantId ?? null) === (variantId ?? null)));
  } else {
    const existing = items.find(
      (i) => i.productId === productId && (i.variantId ?? null) === (variantId ?? null)
    );
    if (existing) existing.quantity = quantity;
  }
  writeGuestCart(items);
  return items;
}

export function clearGuestCart() {
  writeGuestCart([]);
}

// RBAC permission catalogue — kept in a plain (non "server-only") module so it
// can be safely imported from both server code (lib/auth/admin-session.ts)
// and client components (e.g. the admin user manager's permission checklist).

export const ALL_PERMISSIONS = [
  "dashboard.view",
  "products.create",
  "products.edit",
  "products.delete",
  "products.view",
  "orders.view",
  "orders.edit",
  "customers.view",
  "customers.edit",
  "inventory.view",
  "inventory.edit",
  "coupons.manage",
  "reviews.moderate",
  "banners.manage",
  "pages.manage",
  "settings.manage",
  "users.manage",
  "audit.view",
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

// Role -> default permission set. SUPER_ADMIN always has all permissions.
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: [...ALL_PERMISSIONS],
  ADMIN: ALL_PERMISSIONS.filter((p) => p !== "users.manage") as Permission[],
  GERENTE: [
    "dashboard.view",
    "products.create",
    "products.edit",
    "products.view",
    "orders.view",
    "orders.edit",
    "customers.view",
    "customers.edit",
    "inventory.view",
    "inventory.edit",
    "coupons.manage",
    "reviews.moderate",
    "banners.manage",
    "pages.manage",
  ],
  OPERADOR: [
    "dashboard.view",
    "products.view",
    "orders.view",
    "orders.edit",
    "customers.view",
    "inventory.view",
  ],
};

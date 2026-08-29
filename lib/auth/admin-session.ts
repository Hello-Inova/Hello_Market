import "server-only";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";
import type { AdminUser } from "@prisma/client";
import { ALL_PERMISSIONS, ROLE_PERMISSIONS, type Permission } from "@/lib/permissions";
import { enterTenant } from "@/lib/tenant/context";
import { DEFAULT_COMPANY_SLUG } from "@/lib/tenant/resolve";

export { ALL_PERMISSIONS, ROLE_PERMISSIONS, type Permission };

const ADMIN_COOKIE = "hm_admin_session";
const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret-change-in-production";
const SESSION_DURATION = "7d";

export interface AdminTokenPayload {
  sub: string;
  role: string;
}

export async function createAdminSession(admin: AdminUser) {
  const company = await prisma.company.findUnique({ where: { id: admin.companyId } });
  enterTenant({ companyId: admin.companyId, companySlug: company?.slug ?? DEFAULT_COMPANY_SLUG });

  const token = jwt.sign({ sub: admin.id, role: admin.role }, JWT_SECRET, {
    expiresIn: SESSION_DURATION,
  });

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });
}

export type AdminWithCompany = AdminUser & { companySlug: string };

export async function getCurrentAdmin(): Promise<AdminWithCompany | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AdminTokenPayload;
    const admin = await prisma.adminUser.findUnique({ where: { id: payload.sub } });
    if (!admin || !admin.active) return null;
    // Bind this request's tenant from the logged-in admin's own company,
    // re-resolved on every call (not inherited from any ancestor layout)
    // since a Server Action is its own request and never re-runs a page's
    // layout tree before executing.
    const company = await prisma.company.findUnique({ where: { id: admin.companyId } });
    const companySlug = company?.slug ?? DEFAULT_COMPANY_SLUG;
    enterTenant({ companyId: admin.companyId, companySlug });
    return { ...admin, companySlug };
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<AdminWithCompany> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("UNAUTHENTICATED");
  return admin;
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

// ---------------------------------------------------------------------------
// RBAC — granular permissions (section 41)
// ---------------------------------------------------------------------------
// ALL_PERMISSIONS / ROLE_PERMISSIONS live in lib/permissions.ts (a plain module,
// safe to import from client components too) and are re-exported above.

export function adminHasPermission(admin: AdminUser, permission: Permission): boolean {
  if (admin.role === "SUPER_ADMIN") return true;
  if (admin.permissions?.includes(permission)) return true;
  const rolePerms = ROLE_PERMISSIONS[admin.role] ?? [];
  return rolePerms.includes(permission);
}

export async function requirePermission(permission: Permission): Promise<AdminWithCompany> {
  const admin = await requireAdmin();
  if (!adminHasPermission(admin, permission)) {
    throw new Error("FORBIDDEN");
  }
  return admin;
}

import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/admin-session";
import { AdminUserManager } from "@/components/admin/admin-user-manager";

export const metadata: Metadata = { title: "Usuários e permissões" };

export default async function AdminUsersPage() {
  const currentAdmin = await requirePermission("users.manage");
  const users = await prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Usuários e permissões</h1>
      <AdminUserManager
        currentAdminId={currentAdmin.id}
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          permissions: u.permissions,
          active: u.active,
          lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
        }))}
      />
    </div>
  );
}

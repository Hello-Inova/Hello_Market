import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin-session";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { ChangeEmailForm } from "@/components/admin/change-email-form";

export const metadata: Metadata = { title: "Perfil" };

export default async function AdminProfilePage() {
  const admin = await requireAdmin();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Perfil</h1>
        <p className="text-sm text-muted-foreground">
          {admin.name} · {admin.email}
        </p>
      </div>

      <ChangeEmailForm currentEmail={admin.email} />
      <ChangePasswordForm />
    </div>
  );
}

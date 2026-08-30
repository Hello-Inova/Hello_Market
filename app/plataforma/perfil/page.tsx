import type { Metadata } from "next";
import { requirePlatformAdmin } from "@/lib/auth/platform-session";
import { ChangePasswordForm } from "@/components/platform/change-password-form";

export const metadata: Metadata = { title: "Perfil — Plataforma" };

export default async function PlatformProfilePage() {
  const admin = await requirePlatformAdmin();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Perfil</h1>
        <p className="text-sm text-muted-foreground">
          {admin.name} · {admin.email}
        </p>
      </div>

      <ChangePasswordForm />
    </div>
  );
}

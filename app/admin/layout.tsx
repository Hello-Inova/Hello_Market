import { getCurrentAdmin } from "@/lib/auth/admin-session";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    // Unauthenticated: only /admin/login renders here (proxy redirects
    // every other /admin/* route when the session cookie is missing).
    return <>{children}</>;
  }

  return (
    <AdminShell admin={{ name: admin.name, email: admin.email, role: admin.role, avatarUrl: admin.avatarUrl }}>
      {children}
    </AdminShell>
  );
}

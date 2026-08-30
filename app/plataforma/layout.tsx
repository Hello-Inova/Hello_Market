import { getCurrentPlatformAdmin } from "@/lib/auth/platform-session";
import { PlatformShell } from "@/components/platform/platform-shell";

export default async function PlataformaLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentPlatformAdmin();

  if (!admin) {
    // Sem sessão: só /plataforma/login renderiza aqui (o middleware
    // redireciona qualquer outra rota /plataforma/* quando o cookie de
    // sessão está ausente).
    return <>{children}</>;
  }

  return (
    <PlatformShell admin={{ name: admin.name, email: admin.email, role: admin.role }}>
      {children}
    </PlatformShell>
  );
}

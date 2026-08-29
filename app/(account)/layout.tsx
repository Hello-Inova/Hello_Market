import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Package,
  MapPin,
  Heart,
  Star,
  Bell,
  Shield,
  Lock,
  LogOut,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";

const NAV = [
  { href: "/minha-conta", label: "Visão geral", icon: LayoutDashboard },
  { href: "/minha-conta/perfil", label: "Meu perfil", icon: User },
  { href: "/minha-conta/pedidos", label: "Meus pedidos", icon: Package },
  { href: "/minha-conta/enderecos", label: "Meus endereços", icon: MapPin },
  { href: "/minha-conta/favoritos", label: "Favoritos", icon: Heart },
  { href: "/minha-conta/avaliacoes", label: "Minhas avaliações", icon: Star },
  { href: "/minha-conta/notificacoes", label: "Notificações e preferências", icon: Bell },
  { href: "/minha-conta/seguranca", label: "Segurança", icon: Lock },
  { href: "/minha-conta/privacidade", label: "Privacidade (LGPD)", icon: Shield },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=/minha-conta");

  return (
    <div className="container-page grid gap-8 py-6 md:grid-cols-[240px_1fr]">
      <aside className="hidden md:block">
        <div className="mb-4 rounded-xl border p-4">
          <p className="font-medium">{user.fullName}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <nav className="space-y-1 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <item.icon className="h-4 w-4" /> {item.label}
            </Link>
          ))}
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </form>
        </nav>
      </aside>

      <div className="min-w-0">
        <details className="mb-4 rounded-xl border p-3 md:hidden">
          <summary className="cursor-pointer text-sm font-medium">Menu da conta</summary>
          <nav className="mt-3 space-y-1 text-sm">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="block rounded-lg px-3 py-2 hover:bg-secondary">
                {item.label}
              </Link>
            ))}
          </nav>
        </details>
        {children}
      </div>
    </div>
  );
}

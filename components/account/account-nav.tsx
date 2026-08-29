"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  ShoppingCart,
  Home,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/minha-conta", label: "Visão geral", icon: LayoutDashboard },
  { href: "/minha-conta/perfil", label: "Meu perfil", icon: User },
  { href: "/minha-conta/pedidos", label: "Meus pedidos", icon: Package },
  { href: "/minha-conta/enderecos", label: "Meus endereços", icon: MapPin },
  { href: "/minha-conta/favoritos", label: "Favoritos", icon: Heart },
  { href: "/carrinho", label: "Carrinho", icon: ShoppingCart },
  { href: "/minha-conta/avaliacoes", label: "Minhas avaliações", icon: Star },
  { href: "/minha-conta/notificacoes", label: "Notificações e preferências", icon: Bell },
  { href: "/minha-conta/seguranca", label: "Segurança", icon: Lock },
  { href: "/minha-conta/privacidade", label: "Privacidade (LGPD)", icon: Shield },
];

function isActive(pathname: string, base: string, href: string) {
  const full = `${base}${href}`;
  if (href === "/minha-conta") return pathname === full;
  return pathname === full || pathname.startsWith(`${full}/`);
}

function NavLinks({
  base,
  pathname,
  onNavigate,
}: {
  base: string;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-1 text-sm">
      {NAV.map((item) => {
        const active = isActive(pathname, base, item.href);
        return (
          <Link
            key={item.href}
            href={`${base}${item.href}`}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors",
              active
                ? "bg-primary font-medium text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" /> {item.label}
          </Link>
        );
      })}
      <form action="/api/auth/logout" method="post">
        <button
          type="submit"
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4 shrink-0" /> Sair
        </button>
      </form>
      <div className="my-2 border-t" />
      <Link
        href={base}
        onClick={onNavigate}
        className="flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-primary hover:bg-primary/10"
      >
        <Home className="h-4 w-4 shrink-0" /> Home Site
      </Link>
    </nav>
  );
}

interface AccountNavProps {
  base: string;
  userName: string;
  userEmail: string;
}

export function AccountNav({ base, userName, userEmail }: AccountNavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <aside className="hidden md:block">
        <div className="mb-4 rounded-xl border p-4">
          <p className="font-medium">{userName}</p>
          <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
        </div>
        <NavLinks base={base} pathname={pathname} />
      </aside>

      <button
        onClick={() => setMobileOpen(true)}
        className="mb-4 flex w-full items-center gap-2 rounded-xl border p-3 text-sm font-medium md:hidden"
        aria-label="Abrir menu da conta"
      >
        <Menu className="h-4 w-4" /> Menu da conta
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="flex w-72 max-w-[80vw] flex-col overflow-y-auto bg-background p-4 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{userName}</p>
                <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
              </div>
              <button onClick={() => setMobileOpen(false)} aria-label="Fechar menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks base={base} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  );
}

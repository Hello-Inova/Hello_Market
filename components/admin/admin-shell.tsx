"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Boxes,
  Tag,
  Star,
  Image as ImageIcon,
  FileText,
  Settings,
  ShieldCheck,
  ScrollText,
  LogOut,
  Menu,
  FolderTree,
  BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminLogoutAction } from "@/actions/admin-auth.actions";

const NAV = [
  { href: "", label: "Dashboard", icon: LayoutDashboard },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/categorias", label: "Categorias", icon: FolderTree },
  { href: "/marcas", label: "Marcas", icon: BadgeCheck },
  { href: "/pedidos", label: "Pedidos", icon: ShoppingBag },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/estoque", label: "Estoque", icon: Boxes },
  { href: "/cupons", label: "Cupons", icon: Tag },
  { href: "/avaliacoes", label: "Avaliações", icon: Star },
  { href: "/banners", label: "Banners", icon: ImageIcon },
  { href: "/paginas", label: "Páginas", icon: FileText },
  { href: "/usuarios", label: "Usuários e permissões", icon: ShieldCheck },
  { href: "/auditoria", label: "Auditoria", icon: ScrollText },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function AdminShell({
  admin,
  children,
}: {
  admin: { name: string; email: string; role: string; avatarUrl: string | null };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { companySlug } = useParams<{ companySlug: string }>();
  const base = `/admin/${companySlug}`;
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = (
    <>
      <div className="flex items-center gap-2 px-4 py-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-icon.png" alt="MartWeb" className="h-7 w-7" />
        <span className="text-lg font-bold text-white">MartWeb</span>
        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400">ADMIN</span>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
        {NAV.map((item) => {
          const href = `${base}${item.href}`;
          const active = pathname === href || (item.href !== "" && pathname.startsWith(href));
          return (
            <Link
              key={item.href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                active ? "bg-primary text-white" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" /> {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-800 p-3">
        <div className="mb-2 px-1">
          <p className="truncate text-sm font-medium text-white">{admin.name}</p>
          <p className="truncate text-xs text-zinc-500">{admin.role}</p>
        </div>
        <form action={adminLogoutAction.bind(null, companySlug)}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </form>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <aside className="hidden w-64 shrink-0 flex-col bg-zinc-950 md:flex">{SidebarContent}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="flex w-64 flex-col bg-zinc-950">{SidebarContent}</div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b bg-white px-4 md:hidden">
          <button onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-bold">MartWeb Admin</span>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

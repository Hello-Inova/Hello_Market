"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, CreditCard, LogOut, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { platformLogoutAction } from "@/actions/platform-auth.actions";

const NAV = [
  { href: "/plataforma", label: "Dashboard", icon: LayoutDashboard },
  { href: "/plataforma/empresas", label: "Empresas", icon: Building2 },
  { href: "/plataforma/assinaturas", label: "Assinaturas", icon: CreditCard },
];

export function PlatformShell({
  admin,
  children,
}: {
  admin: { name: string; email: string; role: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = (
    <>
      <div className="flex items-center gap-2 px-4 py-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-icon.png" alt="Hello Inova" className="h-7 w-7" />
        <span className="text-lg font-bold text-white">Hello Inova</span>
        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400">PLATAFORMA</span>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/plataforma" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
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
          <p className="truncate text-xs text-zinc-500">{admin.role === "OWNER" ? "Proprietário" : "Equipe"}</p>
        </div>
        <form action={platformLogoutAction}>
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

      {/* Irmão do <aside>/<header> mobile, sem nenhum ancestral com
          transform/filter/backdrop-blur — evita o bug de containing-block
          que já corrigimos no drawer do header da loja (ver header.tsx). */}
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
          <span className="font-bold">Hello Inova — Plataforma</span>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

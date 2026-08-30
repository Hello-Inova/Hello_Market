"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { Heart, Home, Menu, Search, ShoppingCart, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  user: { fullName: string; email: string } | null;
  cartCount: number;
  categories: { name: string; slug: string }[];
  storeName: string;
  logoUrl?: string | null;
}

// Ícone circular com borda (favoritos/conta/carrinho no topo) — mesmo
// tratamento visual do redesign: neutro por padrão, inverte para
// preto/branco no hover, sem depender da cor de marca da empresa.
function IconLinkButton({
  href,
  label,
  children,
  badge,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
    >
      {children}
      {typeof badge === "number" && badge > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

export function Header({ user, cartCount, categories, storeName, logoUrl }: HeaderProps) {
  const router = useRouter();
  const { companySlug } = useParams<{ companySlug: string }>();
  const base = `/loja/${companySlug}`;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`${base}/busca?q=${encodeURIComponent(query.trim())}`);
      setMobileOpen(false);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="container-page flex h-16 items-center gap-3 md:gap-6">
          <button
            className="md:hidden"
            aria-label="Abrir menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <Link href={base} className="shrink-0">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={storeName} className="h-8 w-auto" />
            ) : (
              <span className="font-serif text-xl font-bold tracking-tight text-foreground">{storeName}</span>
            )}
          </Link>

          <form onSubmit={handleSearch} className="hidden flex-1 max-w-xl md:flex">
            <div className="flex w-full items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 transition-colors focus-within:border-foreground">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar produtos"
                className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                aria-label="Buscar produtos"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Minha conta"
                    className="hidden h-10 w-10 place-items-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background sm:grid"
                  >
                    <User className="h-[18px] w-[18px]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Olá, {user.fullName.split(" ")[0]}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={base} className="flex items-center gap-2">
                      <Home className="h-4 w-4" /> Home Site
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`${base}/minha-conta`}>Minha conta</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`${base}/minha-conta/pedidos`}>Meus pedidos</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`${base}/minha-conta/favoritos`}>Favoritos</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <form action="/api/auth/logout" method="post" className="w-full">
                      <button type="submit" className="w-full text-left">
                        Sair
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" size="sm" asChild className="hidden rounded-full sm:inline-flex">
                <Link href={`${base}/entrar`}>Entrar</Link>
              </Button>
            )}

            <span className="hidden sm:block">
              <IconLinkButton
                href={user ? `${base}/minha-conta/favoritos` : `${base}/entrar?next=${base}/minha-conta/favoritos`}
                label="Favoritos"
              >
                <Heart className="h-[18px] w-[18px]" />
              </IconLinkButton>
            </span>

            <IconLinkButton href={`${base}/carrinho`} label="Carrinho" badge={cartCount}>
              <ShoppingCart className="h-[18px] w-[18px]" />
            </IconLinkButton>
          </div>
        </div>

        {categories.length > 0 && (
          <nav className="hidden border-t border-border md:block" aria-label="Categorias">
            <div className="container-page flex h-12 items-center gap-1 overflow-x-auto">
              <Link
                href={`${base}/produtos`}
                className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                Todos
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`${base}/produtos?categoria=${c.slug}`}
                  className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      {/* Fora do <header> de propósito: o header usa backdrop-blur
          (backdrop-filter), que cria um "containing block" para
          descendentes com position:fixed — um <div className="fixed
          inset-0"> preso dentro do header ficava limitado à altura do
          header (64px) em vez de cobrir a tela inteira. Como irmão do
          header, o inset-0 se posiciona corretamente contra a viewport. */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="flex w-72 max-w-[80vw] flex-col overflow-y-auto bg-card p-5 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={storeName} className="h-8 w-auto" />
              ) : (
                <span className="font-serif text-lg font-bold text-foreground">{storeName}</span>
              )}
              <button onClick={() => setMobileOpen(false)} aria-label="Fechar menu">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSearch} className="mb-5">
              <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar..."
                  className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                />
              </div>
            </form>

            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Categorias</p>
            <div className="flex flex-col gap-3 text-sm">
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`${base}/produtos?categoria=${c.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="text-foreground"
                >
                  {c.name}
                </Link>
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 text-sm">
              <Link href={base} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 font-semibold text-foreground">
                <Home className="h-4 w-4" /> Home Site
              </Link>
              {user ? (
                <>
                  <Link href={`${base}/minha-conta`} onClick={() => setMobileOpen(false)}>Minha conta</Link>
                  <Link href={`${base}/minha-conta/pedidos`} onClick={() => setMobileOpen(false)}>Meus pedidos</Link>
                  <Link href={`${base}/minha-conta/favoritos`} onClick={() => setMobileOpen(false)}>Favoritos</Link>
                </>
              ) : (
                <>
                  <Link href={`${base}/entrar`} onClick={() => setMobileOpen(false)}>Entrar</Link>
                  <Link href={`${base}/cadastro`} onClick={() => setMobileOpen(false)}>Criar conta</Link>
                </>
              )}
            </div>
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  );
}

"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { Heart, Menu, Search, ShoppingCart, User, X } from "lucide-react";
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
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-4">
        <button
          className="md:hidden"
          aria-label="Abrir menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        <Link href={base} className="flex items-center gap-2 shrink-0">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={storeName} className="h-8 w-auto" />
          ) : (
            <span className="text-xl font-bold text-primary">{storeName}</span>
          )}
        </Link>

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar produtos, marcas e categorias..."
              className="pl-9 rounded-full"
              aria-label="Buscar produtos"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Minha conta">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Olá, {user.fullName.split(" ")[0]}</DropdownMenuLabel>
                <DropdownMenuSeparator />
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
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link href={`${base}/entrar`}>Entrar</Link>
            </Button>
          )}

          <Button variant="ghost" size="icon" asChild aria-label="Favoritos" className="hidden sm:inline-flex">
            <Link href={user ? `${base}/minha-conta/favoritos` : `${base}/entrar?next=${base}/minha-conta/favoritos`}>
              <Heart className="h-5 w-5" />
            </Link>
          </Button>

          <Button variant="ghost" size="icon" asChild aria-label="Carrinho" className="relative">
            <Link href={`${base}/carrinho`}>
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </div>

      <nav className="hidden md:block border-t">
        <div className="container-page flex h-11 items-center gap-6 overflow-x-auto text-sm">
          {categories.map((c) => (
            <Link key={c.slug} href={`${base}/produtos?categoria=${c.slug}`} className="whitespace-nowrap text-muted-foreground hover:text-foreground">
              {c.name}
            </Link>
          ))}
        </div>
      </nav>

      {mobileOpen && (
        <div className="md:hidden border-t bg-white p-4 space-y-4">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar..."
                className="pl-9 rounded-full"
              />
            </div>
          </form>
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
          <div className="flex flex-col gap-3 border-t pt-3 text-sm">
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
      )}
    </header>
  );
}

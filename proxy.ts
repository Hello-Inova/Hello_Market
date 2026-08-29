import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEFAULT_COMPANY_SLUG } from "@/lib/tenant/resolve";

// Segmentos antigos (pré-Fase 2) da loja pública, hoje todos sob
// `/loja/[companySlug]/...`. Qualquer request para um destes, no nível raiz,
// é uma URL antiga (bookmark, link externo, resultado de busca já indexado)
// e ganha um redirect 308 para o equivalente com slug.
const LEGACY_STOREFRONT_SEGMENTS = new Set([
  "produtos",
  "produto",
  "busca",
  "carrinho",
  "paginas",
  "minha-conta",
  "checkout",
  "entrar",
  "cadastro",
  "esqueci-senha",
  "redefinir-senha",
]);

// Os 13 segmentos de rota admin que existiam soltos direto sob `/admin/*`
// antes da Fase 2, mais `login`. Servem para diferenciar uma URL antiga
// (`/admin/produtos`) de uma nova (`/admin/hello-market/produtos`): o
// segmento logo após `/admin/` é comparado contra esta lista — se bater, é
// antiga. Por isso estes 14 nomes ficam *reservados*: a Fase 5 (cadastro
// autônomo de empresa) precisa rejeitá-los como slug de empresa nova.
export const RESERVED_ADMIN_SEGMENTS = new Set([
  "produtos",
  "categorias",
  "marcas",
  "pedidos",
  "clientes",
  "estoque",
  "cupons",
  "avaliacoes",
  "banners",
  "paginas",
  "usuarios",
  "auditoria",
  "configuracoes",
  "login",
]);

// Reescreve um valor de `next=` que ainda aponte para uma URL antiga (sem
// slug), prefixando-o com `/loja/${DEFAULT_COMPANY_SLUG}` — sem isso, um
// redirect encadeado (ex.: `/entrar?next=/checkout`) cairia de novo numa URL
// antiga depois do login (o proxy corrigiria numa segunda passada, mas
// reescrever aqui evita o salto extra).
function rewriteLegacyNext(nextValue: string): string {
  if (!nextValue.startsWith("/")) return nextValue;
  if (nextValue.startsWith("/loja/") || nextValue.startsWith("/admin/")) return nextValue;
  if (nextValue === "/") return `/loja/${DEFAULT_COMPANY_SLUG}`;
  const firstSegment = nextValue.split("/")[1] ?? "";
  if (LEGACY_STOREFRONT_SEGMENTS.has(firstSegment)) {
    return `/loja/${DEFAULT_COMPANY_SLUG}${nextValue}`;
  }
  return nextValue;
}

function withLegacyNextRewritten(url: URL): URL {
  const nextParam = url.searchParams.get("next");
  if (nextParam) url.searchParams.set("next", rewriteLegacyNext(nextParam));
  return url;
}

// Lightweight route-guard: checks cookie presence only (fast, no DB call).
// Full session/permission validation happens in each page/action via
// lib/auth/session.ts and lib/auth/admin-session.ts.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);

  // --- Redirects de compatibilidade (308) das URLs antigas ---

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/loja/${DEFAULT_COMPANY_SLUG}`;
    return NextResponse.redirect(withLegacyNextRewritten(url), 308);
  }

  if (segments[0] && LEGACY_STOREFRONT_SEGMENTS.has(segments[0])) {
    const url = request.nextUrl.clone();
    url.pathname = `/loja/${DEFAULT_COMPANY_SLUG}${pathname}`;
    return NextResponse.redirect(withLegacyNextRewritten(url), 308);
  }

  if (segments[0] === "admin") {
    const secondSegment = segments[1];
    const isLegacyAdminUrl = !secondSegment || RESERVED_ADMIN_SEGMENTS.has(secondSegment);
    if (isLegacyAdminUrl) {
      const url = request.nextUrl.clone();
      url.pathname = `/admin/${DEFAULT_COMPANY_SLUG}${pathname.replace(/^\/admin/, "")}`;
      return NextResponse.redirect(withLegacyNextRewritten(url), 308);
    }
  }

  // --- Guarda de sessão (checagem rápida de cookie, sem acesso a banco) ---

  if (segments[0] === "loja") {
    const companySlug = segments[1];
    const rest = segments.slice(2); // ex.: ["checkout"], ["minha-conta", "pedidos"]
    const needsCustomerSession = rest[0] === "checkout" || rest[0] === "minha-conta";

    if (companySlug && needsCustomerSession) {
      const hasSession = request.cookies.has("hm_session");
      if (!hasSession) {
        const url = request.nextUrl.clone();
        url.pathname = `/loja/${companySlug}/entrar`;
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
    }
  }

  if (segments[0] === "admin") {
    const companySlug = segments[1];
    const isLoginRoute = segments[2] === "login";

    if (companySlug && !isLoginRoute) {
      const hasAdminSession = request.cookies.has("hm_admin_session");
      if (!hasAdminSession) {
        const url = request.nextUrl.clone();
        url.pathname = `/admin/${companySlug}/login`;
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/loja/:path*",
    "/produtos/:path*",
    "/produto/:path*",
    "/busca/:path*",
    "/carrinho/:path*",
    "/paginas/:path*",
    "/minha-conta/:path*",
    "/checkout/:path*",
    "/entrar/:path*",
    "/cadastro/:path*",
    "/esqueci-senha/:path*",
    "/redefinir-senha/:path*",
  ],
};

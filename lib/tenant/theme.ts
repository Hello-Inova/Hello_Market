import { CURATED_FONTS } from "@/schemas/platform.schema";

export interface CompanyTheme {
  primaryColor: string;
  secondaryColor: string;
  fontColor: string;
  fontFamily: string;
}

/**
 * Fase 4 — gera o CSS de sobrescrita de tema por empresa: reaproveita as
 * mesmas CSS custom properties que app/globals.css já define em :root
 * (--primary, --secondary, --foreground, --font-sans-active), então a
 * cascata do Tailwind (@theme inline) propaga sozinha para todos os
 * componentes que já usam esses tokens — sem precisar tocar em nenhum
 * componente da loja. Um <style> com um segundo bloco :root, renderizado
 * depois do CSS global na árvore de documento, vence por ordem de
 * aparição (mesma especificidade de :root) — o mesmo princípio já usado
 * para o override de fonte em globals.css.
 */
export function companyThemeStyle(theme: CompanyTheme): string {
  const font = CURATED_FONTS.find((f) => f.value === theme.fontFamily) ?? CURATED_FONTS[0];
  return `:root {
  --primary: ${theme.primaryColor};
  --secondary: ${theme.secondaryColor};
  --foreground: ${theme.fontColor};
  --font-sans-active: var(${font.cssVar});
}`;
}

/**
 * Baseline visual do redesign da vitrine (agosto/2026) — paleta neutra
 * preto/branco/cinza, aplicada só dentro de app/loja/[companySlug]/(storefront)
 * (a home e as páginas de catálogo), sem tocar em app/globals.css :root (que
 * também serve o admin e a plataforma, fora do escopo deste redesign).
 *
 * De propósito, este bloco NÃO sobrescreve --primary, --secondary nem
 * --foreground — esses três continuam exclusivamente sob controle de
 * companyThemeStyle() acima (a cor de marca de cada empresa, definida em
 * Configurações → Aparência). Só os tokens "estruturais" (fundo, bordas,
 * tons neutros) que hoje não são configuráveis por empresa mudam aqui.
 * Renderizado depois do <style> de companyThemeStyle() na árvore do
 * documento (layout de loja → layout de storefront), então vence por ordem
 * de aparição só nos tokens que realmente toca — sem conflito com a cor da
 * empresa.
 */
export function storefrontThemeStyle(): string {
  return `:root {
  --background: #f6f6f6;
  --border: #dedede;
  --input: #dedede;
  --muted: #eeeeee;
  --muted-foreground: #767676;
  --accent: #f2f2f2;
  --accent-foreground: #18181b;
  --ring: #18181b;
}`;
}

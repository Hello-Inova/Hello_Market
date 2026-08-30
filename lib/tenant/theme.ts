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

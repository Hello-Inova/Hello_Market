import type { PrismaClient } from "@prisma/client";
import type { TenantContext } from "./context";

/**
 * Fase 1 (path routing ainda não existe — ver Fase 2 do roadmap): existe uma
 * única empresa em produção, então qualquer request sem tenant explícito no
 * contexto (páginas públicas da loja, cron jobs, etc.) cai neste slug fixo.
 * Quando a Fase 2 introduzir `/loja/[companySlug]`, este fallback deixa de
 * ser usado para tráfego normal e passa a servir só de rede de segurança.
 */
export const DEFAULT_COMPANY_SLUG = "hello-market";

let cachedDefaultTenant: TenantContext | null = null;
let cachedDefaultTenantPromise: Promise<TenantContext> | null = null;

/**
 * Resolves the default tenant (by slug), memoized per server instance. Takes
 * the raw (non-extended) Prisma client so this lookup itself never recurses
 * through the tenant-scoping extension — Company isn't a tenant-scoped model
 * anyway, but keeping this explicit avoids any future foot-gun.
 */
export async function resolveDefaultTenant(rawClient: PrismaClient): Promise<TenantContext> {
  if (cachedDefaultTenant) return cachedDefaultTenant;
  if (!cachedDefaultTenantPromise) {
    cachedDefaultTenantPromise = rawClient.company
      .findUniqueOrThrow({ where: { slug: DEFAULT_COMPANY_SLUG } })
      .then((company) => {
        cachedDefaultTenant = { companyId: company.id, companySlug: company.slug };
        return cachedDefaultTenant;
      })
      .catch((err) => {
        // Reset so the next call retries instead of caching a failure forever.
        cachedDefaultTenantPromise = null;
        throw err;
      });
  }
  return cachedDefaultTenantPromise;
}

/**
 * Fase 2: resolve a empresa a partir do slug presente na URL
 * (`/loja/[companySlug]/...` ou `/admin/[companySlug]/...`). Retorna `null`
 * em vez de lançar quando o slug não existe — quem chama decide como reagir
 * (tipicamente `notFound()` num layout). Recebe o client cru pelo mesmo
 * motivo de `resolveDefaultTenant`: esta busca não deve, ela própria,
 * depender de um tenant já estar amarrado ao contexto.
 */
export async function resolveTenantBySlug(
  rawClient: PrismaClient,
  slug: string
): Promise<TenantContext | null> {
  const company = await rawClient.company.findUnique({ where: { slug } });
  if (!company) return null;
  return { companyId: company.id, companySlug: company.slug };
}

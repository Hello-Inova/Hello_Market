import { AsyncLocalStorage } from "node:async_hooks";

export interface TenantContext {
  companyId: string;
  companySlug: string;
}

const als = new AsyncLocalStorage<TenantContext>();

/**
 * Binds a tenant to the current async execution context. Safe to call more
 * than once per request (e.g. once from requireAdmin, again from a nested
 * call) — the latest call wins for everything downstream of it.
 */
export function enterTenant(ctx: TenantContext) {
  als.enterWith(ctx);
}

/** Returns the tenant bound via enterTenant, or undefined if none is set. */
export function getTenantContextOrNull(): TenantContext | undefined {
  return als.getStore();
}

/** Same as getTenantContextOrNull but throws when no tenant is bound. */
export function getTenantContext(): TenantContext {
  const ctx = als.getStore();
  if (!ctx) throw new Error("TENANT_CONTEXT_NOT_SET");
  return ctx;
}

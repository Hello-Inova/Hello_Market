import { PrismaClient } from "@prisma/client";
import { getTenantContextOrNull } from "@/lib/tenant/context";
import { resolveDefaultTenant } from "@/lib/tenant/resolve";

// Prevents creating a new PrismaClient instance on every hot-reload in dev,
// which would otherwise exhaust Neon's connection limit.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaRaw: PrismaClient | undefined;
};

const rawPrisma =
  globalForPrisma.prismaRaw ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaRaw = rawPrisma;

// ---------------------------------------------------------------------------
// Multi-tenant isolation (Fase 1)
// ---------------------------------------------------------------------------
// Every model below carries a required `companyId`. Instead of rewriting the
// ~220 call sites across the app to filter by tenant manually, this extension
// injects `companyId` into every query's `where`/`data` automatically. The
// tenant comes from AsyncLocalStorage (set once per request by requireAdmin);
// when no request-scoped tenant is bound — public storefront pages, cron
// jobs, this Fase 1 code path — it falls back to the single existing tenant
// ("hello-market"). Once Fase 2 adds path-based routing, real per-request
// resolution replaces that fallback for storefront traffic too.
const TENANT_SCOPED_MODELS = new Set([
  "AdminUser",
  "User",
  "Category",
  "Brand",
  "Product",
  "ProductVariant",
  "Coupon",
  "Order",
  "Page",
  "Setting",
  "Banner",
  "Review",
  "InventoryMovement",
  "Notification",
  "AuditLog",
]);

async function currentCompanyId(): Promise<string> {
  const ctx = getTenantContextOrNull();
  if (ctx) return ctx.companyId;
  const fallback = await resolveDefaultTenant(rawPrisma);
  return fallback.companyId;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rawDelegate(model: string): any {
  const property = model.charAt(0).toLowerCase() + model.slice(1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (rawPrisma as any)[property];
}

function withTenantScoping(client: PrismaClient) {
  return client.$extends({
    name: "tenant-scoping",
    query: {
      $allModels: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async $allOperations({ model, operation, args, query }: any) {
          if (!model || !TENANT_SCOPED_MODELS.has(model)) return query(args);

          const companyId = await currentCompanyId();

          if (operation === "create") {
            args.data = { ...args.data, companyId };
            return query(args);
          }

          if (operation === "createMany" || operation === "createManyAndReturn") {
            args.data = Array.isArray(args.data)
              ? args.data.map((d: Record<string, unknown>) => ({ ...d, companyId }))
              : args.data;
            return query(args);
          }

          if (operation === "findUnique" || operation === "findUniqueOrThrow") {
            const originalWhere = args.where ?? {};
            args.where = { ...originalWhere, companyId };
            if ("id" in originalWhere) return query(args);
            // Several fields that used to be globally @unique (email, slug,
            // sku, code, orderNumber, key...) became composite-unique with
            // companyId in Step C. Prisma's WhereUniqueInput for a composite
            // unique needs the compound key name, not a flat object, so a
            // plain merge here would fail Prisma's own validation. Since
            // companyId is already part of the filter, findFirst is exactly
            // equivalent to findUnique in practice — reroute to it via the
            // raw (unscoped) client to avoid recursing through this extension.
            const delegate = rawDelegate(model);
            return operation === "findUniqueOrThrow"
              ? delegate.findFirstOrThrow(args)
              : delegate.findFirst(args);
          }

          if (operation === "upsert") {
            const originalWhere = args.where ?? {};
            const whereWithCompany = { ...originalWhere, companyId };
            if ("id" in originalWhere) {
              args.where = whereWithCompany;
              args.create = { ...args.create, companyId };
              return query(args);
            }
            // Same composite-unique problem as findUnique above — upsert's
            // where has the same shape requirement. Emulate upsert manually
            // against the raw client instead of forcing an invalid where.
            const delegate = rawDelegate(model);
            const existing = await delegate.findFirst({ where: whereWithCompany });
            if (existing) {
              return delegate.update({ where: { id: existing.id }, data: args.update });
            }
            return delegate.create({ data: { ...args.create, companyId } });
          }

          // findMany / findFirst / findFirstOrThrow / count / aggregate /
          // groupBy / update / updateMany / delete / deleteMany — `update`
          // and `delete` (singular) in this codebase are always called with
          // `id` in the where, which stays a valid unique selector after
          // Step C, so a flat merge is safe here.
          args.where = { ...(args.where ?? {}), companyId };
          return query(args);
        },
      },
    },
  });
}

export const prisma =
  (globalForPrisma.prisma as ReturnType<typeof withTenantScoping> | undefined) ??
  withTenantScoping(rawPrisma);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma as unknown as PrismaClient;
}

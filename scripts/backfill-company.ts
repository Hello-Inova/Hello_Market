/**
 * Hello Market — multi-tenant migration backfill (Fase 1, Passo B).
 *
 * Run this ONCE, locally, against the PRODUCTION DATABASE_URL, after the
 * Step A migration (Company/Plan/Subscription tables + nullable companyId
 * columns) has already been deployed.
 *
 * What it does:
 *   1. Creates a single Company row (slug "hello-market") — the existing
 *      store becomes the platform's first tenant.
 *   2. Backfills companyId on every row of the 15 tenant-scoped models that
 *      currently has companyId = NULL, pointing them all at that Company.
 *   3. Prints a before/after null-count report so you can confirm the
 *      backfill is complete (all counts should read 0 afterwards).
 *
 * Safe to run more than once: it exits immediately (no writes) if a
 * Company row already exists.
 *
 * Run with (same pattern you already used for db:seed):
 *   $env:DATABASE_URL="postgresql://...production connection string..."
 *   npx tsx scripts/backfill-company.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TENANT_SCOPED_MODELS = [
  "adminUser",
  "user",
  "category",
  "brand",
  "product",
  "productVariant",
  "coupon",
  "order",
  "page",
  "setting",
  "banner",
  "review",
  "inventoryMovement",
  "notification",
  "auditLog",
] as const;

type ModelName = (typeof TENANT_SCOPED_MODELS)[number];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function modelDelegate(name: ModelName): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prisma as any)[name];
}

async function countNulls() {
  const counts: Record<string, number> = {};
  for (const model of TENANT_SCOPED_MODELS) {
    counts[model] = await modelDelegate(model).count({ where: { companyId: null } });
  }
  return counts;
}

async function main() {
  console.log("🏢 Backfill de multi-tenant — Hello Market\n");

  const existing = await prisma.company.count();
  if (existing > 0) {
    console.log("⚠️  Já existe uma empresa cadastrada — nada a fazer. Abortando sem alterações.");
    return;
  }

  console.log("Contagem de registros sem companyId (antes):");
  const before = await countNulls();
  console.table(before);

  const company = await prisma.company.create({
    data: {
      slug: "hello-market",
      name: "Hello Market",
      status: "ACTIVE",
    },
  });
  console.log(`\n✅ Empresa criada: ${company.name} (id: ${company.id}, slug: ${company.slug})\n`);

  console.log("Atualizando registros...");
  const updated: Record<string, number> = {};
  for (const model of TENANT_SCOPED_MODELS) {
    const result = await modelDelegate(model).updateMany({
      where: { companyId: null },
      data: { companyId: company.id },
    });
    updated[model] = result.count;
    console.log(`  ${model}: ${result.count} registro(s) atualizado(s)`);
  }

  console.log("\nContagem de registros sem companyId (depois — deve ser tudo 0):");
  const after = await countNulls();
  console.table(after);

  const stillNull = Object.values(after).some((n) => n > 0);
  if (stillNull) {
    console.log("\n⚠️  Ainda restam registros sem companyId. Investigue antes de prosseguir para o Passo C.");
  } else {
    console.log("\n🎉 Backfill completo — todos os registros existentes agora pertencem à empresa 'hello-market'.");
  }
}

main()
  .catch((err) => {
    console.error("❌ Backfill falhou:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

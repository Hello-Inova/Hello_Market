import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";

/**
 * Rota interna de configuração inicial da Fase 3 (Plataforma Hello Inova):
 * cria os planos padrão e o primeiro PlatformAdmin (proprietário), para que
 * exista alguém que consiga logar em /plataforma/login antes de qualquer
 * empresa/assinatura existir. Protegida por um segredo simples via query
 * string (mesmo espírito das rotas internas de setup já usadas no projeto)
 * e idempotente: se já existir um PlatformAdmin, responde 409 sem alterar
 * nada — pode ser chamada de novo com segurança.
 *
 * Uso (uma única vez, após o primeiro deploy da Fase 3):
 *   GET /api/internal/bootstrap-platform?secret=<PLATFORM_SETUP_SECRET>
 *
 * Configure PLATFORM_SETUP_SECRET nas variáveis de ambiente da Vercel antes
 * de chamar essa rota em produção (sem essa variável, usa um valor padrão
 * de desenvolvimento — troque assim que possível).
 */
export async function GET(request: Request) {
  const secret = new URL(request.url).searchParams.get("secret");
  const expected = process.env.PLATFORM_SETUP_SECRET || "hello-inova-setup-2026";
  if (secret !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const existing = await prisma.platformAdmin.count();
  if (existing > 0) {
    return NextResponse.json({ error: "already_bootstrapped" }, { status: 409 });
  }

  const passwordHash = await hashPassword("HelloInova@2026");

  const [owner] = await Promise.all([
    prisma.platformAdmin.create({
      data: {
        name: "Hello Inova",
        email: "plataforma@helloinova.com.br",
        passwordHash,
        role: "OWNER",
      },
    }),
    prisma.plan.createMany({
      data: [
        { name: "Semestral", cycle: "SEMIANNUAL", priceCents: 149700 },
        { name: "Anual", cycle: "ANNUAL", priceCents: 249700 },
      ],
      skipDuplicates: true,
    }),
  ]);

  return NextResponse.json({
    ok: true,
    platformAdmin: { email: owner.email },
    message: "Login em /plataforma/login com a senha padrão HelloInova@2026 — troque assim que possível.",
  });
}

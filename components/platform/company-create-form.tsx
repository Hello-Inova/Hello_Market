"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createCompanyAction, type ActionResult } from "@/actions/platform/companies.actions";
import { slugify, formatCurrency } from "@/lib/utils";

const initialState: ActionResult = { success: false };

interface PlanOption {
  id: string;
  name: string;
  cycle: "SEMIANNUAL" | "ANNUAL";
  priceCents: number;
}

export function CompanyCreateForm({ plans }: { plans: PlanOption[] }) {
  const [state, formAction, isPending] = useActionState(createCompanyAction, initialState);
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const err = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados da empresa</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Nome da empresa</Label>
            <Input
              name="name"
              required
              onChange={(e) => {
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              aria-invalid={!!err.name}
            />
            {err.name && <p className="text-xs text-destructive">{err.name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Identificador (usado na URL)</Label>
            <Input
              name="slug"
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              aria-invalid={!!err.slug}
            />
            <p className="text-xs text-muted-foreground">
              Loja em /loja/{slug || "identificador"} — admin em /admin/{slug || "identificador"}
            </p>
            {err.slug && <p className="text-xs text-destructive">{err.slug}</p>}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Plano</Label>
            <select name="planId" required className="w-full rounded-lg border px-3 py-2 text-sm" defaultValue="">
              <option value="" disabled>
                Selecione um plano
              </option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatCurrency(p.priceCents / 100)} / {p.cycle === "SEMIANNUAL" ? "semestre" : "ano"}
                </option>
              ))}
            </select>
            {plans.length === 0 && (
              <p className="text-xs text-amber-600">
                Nenhum plano cadastrado ainda — rode o bootstrap inicial da plataforma antes de criar empresas.
              </p>
            )}
            {err.planId && <p className="text-xs text-destructive">{err.planId}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Responsável (admin da empresa)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input name="adminName" required aria-invalid={!!err.adminName} />
            {err.adminName && <p className="text-xs text-destructive">{err.adminName}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input name="adminEmail" type="email" required aria-invalid={!!err.adminEmail} />
            {err.adminEmail && <p className="text-xs text-destructive">{err.adminEmail}</p>}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Senha provisória</Label>
            <Input name="adminPassword" type="password" required aria-invalid={!!err.adminPassword} />
            {err.adminPassword && <p className="text-xs text-destructive">{err.adminPassword}</p>}
          </div>
        </CardContent>
      </Card>

      {state.message && <p className="text-sm text-destructive">{state.message}</p>}

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? "Criando..." : "Criar empresa"}
      </Button>
    </form>
  );
}

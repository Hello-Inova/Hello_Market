"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateCompanyAction, type ActionResult } from "@/actions/platform/companies.actions";
import { CURATED_FONTS } from "@/schemas/platform.schema";
import type { Company } from "@prisma/client";

const initialState: ActionResult = { success: false };

const STATUS_OPTIONS = [
  { value: "TRIAL", label: "Trial" },
  { value: "ACTIVE", label: "Ativa" },
  { value: "PAST_DUE", label: "Pagamento pendente" },
  { value: "SUSPENDED", label: "Suspensa" },
  { value: "CANCELLED", label: "Cancelada" },
];

export function CompanyEditForm({ company }: { company: Company }) {
  const action = updateCompanyAction.bind(null, company.id);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const err = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados cadastrais</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Nome da empresa</Label>
            <Input name="name" defaultValue={company.name} required aria-invalid={!!err.name} />
            {err.name && <p className="text-xs text-destructive">{err.name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Razão social</Label>
            <Input name="legalName" defaultValue={company.legalName ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label>CNPJ</Label>
            <Input name="document" defaultValue={company.document ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <select name="status" defaultValue={company.status} className="w-full rounded-lg border px-3 py-2 text-sm">
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>E-mail de contato</Label>
            <Input name="email" type="email" defaultValue={company.email ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label>Telefone</Label>
            <Input name="phone" defaultValue={company.phone ?? ""} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aparência (Fase 4 — tema da loja)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Cor primária</Label>
            <input type="color" name="primaryColor" defaultValue={company.primaryColor} className="h-10 w-12 rounded border" />
          </div>
          <div className="space-y-1.5">
            <Label>Cor secundária</Label>
            <input type="color" name="secondaryColor" defaultValue={company.secondaryColor} className="h-10 w-12 rounded border" />
          </div>
          <div className="space-y-1.5">
            <Label>Cor do texto</Label>
            <input type="color" name="fontColor" defaultValue={company.fontColor} className="h-10 w-12 rounded border" />
          </div>
          <div className="space-y-1.5">
            <Label>Fonte</Label>
            <select name="fontFamily" defaultValue={company.fontFamily} className="w-full rounded-lg border px-3 py-2 text-sm">
              {CURATED_FONTS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>URL do logo</Label>
            <Input name="logoUrl" defaultValue={company.logoUrl ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label>URL do favicon</Label>
            <Input name="faviconUrl" defaultValue={company.faviconUrl ?? ""} />
          </div>
        </CardContent>
      </Card>

      {state.message && <p className="text-sm text-destructive">{state.message}</p>}
      {state.success && <p className="text-sm text-green-700">Alterações salvas.</p>}

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}

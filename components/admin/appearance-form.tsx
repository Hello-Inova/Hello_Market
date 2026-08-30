"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateCompanyThemeAction, type ActionResult } from "@/actions/admin/company.actions";
import { CURATED_FONTS } from "@/schemas/platform.schema";

const initialState: ActionResult = { success: false };

export interface AppearanceDefaults {
  primaryColor: string;
  secondaryColor: string;
  fontColor: string;
  fontFamily: string;
  logoUrl: string | null;
  faviconUrl: string | null;
}

export function AppearanceForm({ defaults }: { defaults: AppearanceDefaults }) {
  const [state, formAction, isPending] = useActionState(updateCompanyThemeAction, initialState);

  useEffect(() => {
    if (state.success) toast.success("Aparência atualizada.");
    else if (state.message) toast.error(state.message);
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aparência da loja</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Cor primária</Label>
            <input type="color" name="primaryColor" defaultValue={defaults.primaryColor} className="h-10 w-full rounded border sm:w-16" />
          </div>
          <div className="space-y-1.5">
            <Label>Cor secundária</Label>
            <input type="color" name="secondaryColor" defaultValue={defaults.secondaryColor} className="h-10 w-full rounded border sm:w-16" />
          </div>
          <div className="space-y-1.5">
            <Label>Cor do texto</Label>
            <input type="color" name="fontColor" defaultValue={defaults.fontColor} className="h-10 w-full rounded border sm:w-16" />
          </div>
          <div className="space-y-1.5">
            <Label>Fonte</Label>
            <select name="fontFamily" defaultValue={defaults.fontFamily} className="w-full rounded-lg border px-3 py-2 text-sm">
              {CURATED_FONTS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>URL do logo (opcional)</Label>
            <Input name="logoUrl" defaultValue={defaults.logoUrl ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label>URL do favicon (opcional)</Label>
            <Input name="faviconUrl" defaultValue={defaults.faviconUrl ?? ""} />
          </div>

          <p className="text-xs text-muted-foreground sm:col-span-2">
            As cores e a fonte valem para toda a loja pública (não afetam este painel administrativo).
          </p>

          <div className="sm:col-span-2">
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? "Salvando..." : "Salvar aparência"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

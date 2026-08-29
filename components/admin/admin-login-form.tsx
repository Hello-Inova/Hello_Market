"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminLoginAction, type ActionResult } from "@/actions/admin-auth.actions";

const initialState: ActionResult = { success: false };

// Login bem-sucedido é tratado inteiramente no servidor: adminLoginAction
// chama redirect() após criar a sessão, então esta action só "retorna" (com
// success: false) no caminho de erro — não há navegação client-side aqui.
export function AdminLoginForm({ companySlug }: { companySlug: string }) {
  const [state, formAction, isPending] = useActionState(adminLoginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="companySlug" value={companySlug} />
      <div className="space-y-1.5">
        <Label className="text-zinc-300">E-mail</Label>
        <Input name="email" type="email" required className="border-zinc-700 bg-zinc-800 text-white" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-zinc-300">Senha</Label>
        <Input name="password" type="password" required className="border-zinc-700 bg-zinc-800 text-white" />
      </div>
      {state.message && <p className="text-sm text-red-400">{state.message}</p>}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}

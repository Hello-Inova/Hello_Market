"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { platformLoginAction, type ActionResult } from "@/actions/platform-auth.actions";

const initialState: ActionResult = { success: false };

// Login bem-sucedido é tratado inteiramente no servidor (mesmo padrão do
// AdminLoginForm) — a action chama redirect() após criar a sessão.
export function PlatformLoginForm() {
  const [state, formAction, isPending] = useActionState(platformLoginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
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

"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminLoginAction, type ActionResult } from "@/actions/admin-auth.actions";

const initialState: ActionResult = { success: false };

export default function AdminLoginPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(adminLoginAction, initialState);

  useEffect(() => {
    if (state.success) {
      router.push("/admin");
      router.refresh();
    }
  }, [state, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-white">
        <h1 className="mb-1 text-xl font-bold">Painel Administrativo</h1>
        <p className="mb-6 text-sm text-zinc-400">Hello Market</p>
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
        <p className="mt-4 text-xs text-zinc-500">
          Acesso restrito à equipe administrativa. Demo: admin@hellomarket.com.br / Admin@123
        </p>
      </div>
    </div>
  );
}

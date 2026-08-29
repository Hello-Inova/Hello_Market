"use client";

import { useActionState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordAction, type ActionResult } from "@/actions/auth.actions";

const initialState: ActionResult = { success: false };

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const { companySlug } = useParams<{ companySlug: string }>();
  const [state, formAction, isPending] = useActionState(resetPasswordAction, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      router.push(`/loja/${companySlug}/entrar`);
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <h1 className="text-xl font-bold">Criar nova senha</h1>
      </div>
      <input type="hidden" name="token" value={token} />
      <div className="space-y-1.5">
        <Label htmlFor="password">Nova senha</Label>
        <Input id="password" name="password" type="password" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Salvando..." : "Redefinir senha"}
      </Button>
    </form>
  );
}

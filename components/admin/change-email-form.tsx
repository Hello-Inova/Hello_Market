"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { changeMyEmailAction, type ActionResult } from "@/actions/admin/user.actions";

const initialState: ActionResult = { success: false };

export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(changeMyEmailAction, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      router.refresh();
    }
  }, [state, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alterar e-mail</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="max-w-sm space-y-3">
          <div className="space-y-1.5">
            <Label>E-mail atual</Label>
            <Input value={currentEmail} disabled className="bg-secondary" />
          </div>
          <div className="space-y-1.5">
            <Label>Novo e-mail</Label>
            <Input name="newEmail" type="email" required />
          </div>
          <div className="space-y-1.5">
            <Label>Senha atual</Label>
            <PasswordInput name="currentPassword" required />
          </div>
          <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
            {isPending ? "Salvando..." : "Alterar e-mail"}
          </Button>
          {state.message && (
            <p className={`text-sm ${state.success ? "text-green-700" : "text-destructive"}`}>{state.message}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

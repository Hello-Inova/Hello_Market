"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { changeMyPasswordAction, type ActionResult } from "@/actions/admin/user.actions";

const initialState: ActionResult = { success: false };

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(changeMyPasswordAction, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alterar senha</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="max-w-sm space-y-3">
          <div className="space-y-1.5">
            <Label>Senha atual</Label>
            <PasswordInput name="currentPassword" required />
          </div>
          <div className="space-y-1.5">
            <Label>Nova senha</Label>
            <PasswordInput name="newPassword" required />
          </div>
          <div className="space-y-1.5">
            <Label>Confirmar nova senha</Label>
            <PasswordInput name="confirmPassword" required />
          </div>
          <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
            {isPending ? "Salvando..." : "Alterar senha"}
          </Button>
          {state.message && (
            <p className={`text-sm ${state.success ? "text-green-700" : "text-destructive"}`}>{state.message}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

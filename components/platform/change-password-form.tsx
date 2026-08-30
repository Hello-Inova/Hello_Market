"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { changePlatformPasswordAction, type ActionResult } from "@/actions/platform-auth.actions";

const initialState: ActionResult = { success: false };

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(changePlatformPasswordAction, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alterar senha</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="max-w-sm space-y-3">
          <div className="space-y-1.5">
            <Label>Senha atual</Label>
            <Input name="currentPassword" type="password" required />
          </div>
          <div className="space-y-1.5">
            <Label>Nova senha</Label>
            <Input name="newPassword" type="password" required />
          </div>
          <div className="space-y-1.5">
            <Label>Confirmar nova senha</Label>
            <Input name="confirmPassword" type="password" required />
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

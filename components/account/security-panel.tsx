"use client";

import { useActionState, useTransition } from "react";
import { toast } from "sonner";
import { Laptop, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordAction, type ActionResult } from "@/actions/auth.actions";
import { terminateSessionAction, terminateAllOtherSessionsAction } from "@/actions/session.actions";
import { formatDateTime } from "@/lib/utils";

interface SessionData {
  id: string;
  userAgent: string | null;
  ip: string | null;
  lastActiveAt: string;
  isCurrent: boolean;
}

const initialState: ActionResult = { success: false };

export function SecurityPanel({ sessions }: { sessions: SessionData[] }) {
  const [state, formAction, isPending] = useActionState(changePasswordAction, initialState);
  const [isTransitioning, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-3 font-semibold">Alterar senha</h2>
        <form
          action={(fd) => {
            formAction(fd);
          }}
          className="max-w-sm space-y-3"
        >
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
          <Button type="submit" disabled={isPending}>
            {isPending ? "Salvando..." : "Alterar senha"}
          </Button>
          {state.message && (
            <p className={`text-sm ${state.success ? "text-green-700" : "text-destructive"}`}>{state.message}</p>
          )}
        </form>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Sessões ativas</h2>
          <Button
            variant="outline"
            size="sm"
            disabled={isTransitioning}
            onClick={() =>
              startTransition(async () => {
                await terminateAllOtherSessionsAction();
                toast.success("Outras sessões encerradas.");
              })
            }
          >
            Encerrar todas as outras
          </Button>
        </div>
        <div className="space-y-2">
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl border p-3 text-sm">
              {/iphone|android|mobile/i.test(s.userAgent ?? "") ? (
                <Smartphone className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Laptop className="h-4 w-4 text-muted-foreground" />
              )}
              <div className="flex-1 truncate">
                <p className="truncate">{s.userAgent ?? "Dispositivo desconhecido"}</p>
                <p className="text-xs text-muted-foreground">
                  {s.ip ?? "IP desconhecido"} — última atividade {formatDateTime(s.lastActiveAt)}
                </p>
              </div>
              {s.isCurrent ? (
                <span className="text-xs font-medium text-primary">Sessão atual</span>
              ) : (
                <button
                  className="text-xs text-destructive hover:underline"
                  onClick={() =>
                    startTransition(async () => {
                      await terminateSessionAction(s.id);
                      toast.success("Sessão encerrada.");
                    })
                  }
                >
                  Encerrar
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

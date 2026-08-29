"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { requestDataExportAction, requestAccountDeletionAction } from "@/actions/privacy.actions";

export function PrivacyPanel() {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <div className="rounded-xl border p-4">
        <h2 className="mb-1 font-semibold">Seus dados</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Conforme a LGPD, você pode solicitar uma cópia de todos os dados que mantemos sobre você.
        </p>
        <Button
          variant="outline"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await requestDataExportAction();
              toast.success(result.message ?? "Solicitação registrada.");
            })
          }
        >
          <Download className="h-4 w-4" /> Solicitar exportação de dados
        </Button>
      </div>

      <div className="rounded-xl border border-destructive/30 p-4">
        <h2 className="mb-1 font-semibold text-destructive">Excluir conta</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Sua conta será desativada e seus dados pessoais anonimizados. Informações de pedidos serão mantidas
          pelo prazo legal exigido para fins fiscais e de defesa do consumidor.
        </p>
        <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
          <Trash2 className="h-4 w-4" /> Solicitar exclusão da conta
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão de conta</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Esta ação não pode ser desfeita. Você será desconectado imediatamente.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await requestAccountDeletionAction();
                  router.push("/");
                  router.refresh();
                })
              }
            >
              Confirmar exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

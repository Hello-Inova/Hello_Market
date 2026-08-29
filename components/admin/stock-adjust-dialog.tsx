"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { adjustProductStockAction } from "@/actions/admin/inventory.actions";

interface Variant {
  id: string;
  name: string;
  stock: number;
}

export function StockAdjustDialog({ productId, productName, stock, variants }: { productId: string; productName: string; stock: number; variants: Variant[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [variantId, setVariantId] = useState("");
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");

  function handleSubmit() {
    const deltaNum = Number(delta);
    if (!deltaNum) {
      toast.error("Informe uma quantidade diferente de zero.");
      return;
    }
    startTransition(async () => {
      const result = await adjustProductStockAction({
        productId,
        variantId: variantId || null,
        delta: deltaNum,
        reason,
      });
      if (result.success) {
        toast.success("Estoque ajustado.");
        setOpen(false);
        setDelta("");
        setReason("");
        router.refresh();
      } else toast.error(result.message);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Boxes className="h-3.5 w-3.5" /> Ajustar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Ajustar estoque — {productName}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {variants.length > 0 && (
            <div className="space-y-1.5">
              <Label>Variação</Label>
              <select
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={variantId}
                onChange={(e) => setVariantId(e.target.value)}
              >
                <option value="">Produto principal ({stock} un)</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>{v.name} ({v.stock} un)</option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Quantidade (use negativo para reduzir)</Label>
            <Input type="number" value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="Ex: 10 ou -5" />
          </div>
          <div className="space-y-1.5">
            <Label>Motivo</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Ex: Reposição de fornecedor, inventário, avaria..." />
          </div>
          <Button className="w-full" disabled={isPending} onClick={handleSubmit}>
            {isPending ? "Salvando..." : "Confirmar ajuste"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { saveCouponAction, deleteCouponAction } from "@/actions/admin/coupon.actions";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  value: number;
  minOrderValue: number | null;
  maxDiscountValue: number | null;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  usageLimitPerUser: number;
  usedCount: number;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED";
}

const TYPE_LABEL: Record<string, string> = { PERCENTAGE: "Percentual", FIXED: "Valor fixo", FREE_SHIPPING: "Frete grátis" };

export function CouponManager({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [type, setType] = useState<Coupon["type"]>("PERCENTAGE");
  const [isPending, startTransition] = useTransition();

  function openNew() {
    setEditing(null);
    setType("PERCENTAGE");
    setOpen(true);
  }

  function openEdit(c: Coupon) {
    setEditing(c);
    setType(c.type);
    setOpen(true);
  }

  function handleSubmit(formData: FormData) {
    const payload = {
      code: String(formData.get("code") ?? ""),
      description: String(formData.get("description") ?? ""),
      type,
      value: Number(formData.get("value") ?? 0),
      minOrderValue: formData.get("minOrderValue") ? Number(formData.get("minOrderValue")) : null,
      maxDiscountValue: formData.get("maxDiscountValue") ? Number(formData.get("maxDiscountValue")) : null,
      startsAt: formData.get("startsAt") ? String(formData.get("startsAt")) : null,
      endsAt: formData.get("endsAt") ? String(formData.get("endsAt")) : null,
      usageLimit: formData.get("usageLimit") ? Number(formData.get("usageLimit")) : null,
      usageLimitPerUser: Number(formData.get("usageLimitPerUser") ?? 1),
      allowedCategoryIds: [],
      allowedProductIds: [],
      status: (formData.get("status") as Coupon["status"]) ?? "ACTIVE",
    };
    startTransition(async () => {
      const result = await saveCouponAction(editing?.id ?? null, payload);
      if (result.success) {
        toast.success("Cupom salvo.");
        setOpen(false);
        router.refresh();
      } else toast.error(result.message);
    });
  }

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
        <DialogTrigger asChild>
          <Button onClick={openNew}><Plus className="h-4 w-4" /> Novo cupom</Button>
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} cupom</DialogTitle></DialogHeader>
          <form action={handleSubmit} className="space-y-3">
            <div className="space-y-1.5"><Label>Código</Label><Input name="code" defaultValue={editing?.code} required /></div>
            <div className="space-y-1.5"><Label>Descrição</Label><Textarea name="description" defaultValue={editing?.description ?? ""} rows={2} /></div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as Coupon["type"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentual</SelectItem>
                  <SelectItem value="FIXED">Valor fixo</SelectItem>
                  <SelectItem value="FREE_SHIPPING">Frete grátis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Valor {type === "PERCENTAGE" ? "(%)" : "(R$)"}</Label><Input name="value" type="number" step="0.01" defaultValue={editing?.value} required /></div>
              <div className="space-y-1.5"><Label>Desconto máximo (R$)</Label><Input name="maxDiscountValue" type="number" step="0.01" defaultValue={editing?.maxDiscountValue ?? ""} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Pedido mínimo (R$)</Label><Input name="minOrderValue" type="number" step="0.01" defaultValue={editing?.minOrderValue ?? ""} /></div>
              <div className="space-y-1.5"><Label>Limite de uso (total)</Label><Input name="usageLimit" type="number" defaultValue={editing?.usageLimit ?? ""} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Limite por cliente</Label><Input name="usageLimitPerUser" type="number" defaultValue={editing?.usageLimitPerUser ?? 1} /></div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <select name="status" defaultValue={editing?.status ?? "ACTIVE"} className="w-full rounded-lg border px-3 py-2 text-sm">
                  <option value="ACTIVE">Ativo</option>
                  <option value="INACTIVE">Inativo</option>
                  <option value="EXPIRED">Expirado</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Início</Label><Input name="startsAt" type="date" defaultValue={editing?.startsAt?.slice(0, 10) ?? ""} /></div>
              <div className="space-y-1.5"><Label>Término</Label><Input name="endsAt" type="date" defaultValue={editing?.endsAt?.slice(0, 10) ?? ""} /></div>
            </div>
            <Button type="submit" disabled={isPending} className="w-full">{isPending ? "Salvando..." : "Salvar"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="table-scroll rounded-xl border bg-white">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b bg-secondary/50 text-left text-muted-foreground">
              <th className="p-3">Código</th><th className="p-3">Tipo</th><th className="p-3">Valor</th>
              <th className="p-3">Usos</th><th className="p-3">Validade</th><th className="p-3">Status</th><th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{c.code}</td>
                <td className="p-3 text-muted-foreground">{TYPE_LABEL[c.type]}</td>
                <td className="p-3">{c.type === "PERCENTAGE" ? `${c.value}%` : c.type === "FIXED" ? formatCurrency(c.value) : "—"}</td>
                <td className="p-3 text-muted-foreground">{c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ""}</td>
                <td className="p-3 text-muted-foreground">{c.endsAt ? formatDate(c.endsAt) : "Sem prazo"}</td>
                <td className="p-3">
                  <Badge variant={c.status === "ACTIVE" ? "success" : c.status === "EXPIRED" ? "warning" : "secondary"}>
                    {c.status === "ACTIVE" ? "Ativo" : c.status === "EXPIRED" ? "Expirado" : "Inativo"}
                  </Badge>
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => openEdit(c)} className="mr-3 text-primary"><Pencil className="h-4 w-4 inline" /></button>
                  <button
                    onClick={() => startTransition(async () => {
                      const result = await deleteCouponAction(c.id);
                      if (result.success) { toast.success(result.message ?? "Excluído."); router.refresh(); } else toast.error(result.message);
                    })}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Nenhum cupom cadastrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

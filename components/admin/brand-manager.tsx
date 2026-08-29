"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { saveBrandAction, deleteBrandAction } from "@/actions/admin/taxonomy.actions";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  website: string | null;
  status: boolean;
}

export function BrandManager({ brands }: { brands: Brand[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    const payload = {
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      logoUrl: String(formData.get("logoUrl") ?? ""),
      description: String(formData.get("description") ?? ""),
      website: String(formData.get("website") ?? ""),
      status: formData.get("status") === "on",
    };
    startTransition(async () => {
      const result = await saveBrandAction(editing?.id ?? null, payload);
      if (result.success) {
        toast.success("Marca salva.");
        setOpen(false);
        setEditing(null);
        router.refresh();
      } else toast.error(result.message);
    });
  }

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
        <DialogTrigger asChild>
          <Button onClick={() => setEditing(null)}><Plus className="h-4 w-4" /> Nova marca</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Nova"} marca</DialogTitle></DialogHeader>
          <form action={handleSubmit} className="space-y-3">
            <div className="space-y-1.5"><Label>Nome</Label><Input name="name" defaultValue={editing?.name} required /></div>
            <div className="space-y-1.5"><Label>Slug (opcional)</Label><Input name="slug" defaultValue={editing?.slug} /></div>
            <div className="space-y-1.5"><Label>URL do logo</Label><Input name="logoUrl" defaultValue={editing?.logoUrl ?? ""} /></div>
            <div className="space-y-1.5"><Label>Site</Label><Input name="website" defaultValue={editing?.website ?? ""} /></div>
            <div className="space-y-1.5"><Label>Descrição</Label><Textarea name="description" defaultValue={editing?.description ?? ""} rows={3} /></div>
            <label className="flex items-center gap-3"><Switch name="status" defaultChecked={editing?.status ?? true} /><span className="text-sm">Ativa</span></label>
            <Button type="submit" disabled={isPending} className="w-full">{isPending ? "Salvando..." : "Salvar"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="table-scroll rounded-xl border bg-white">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b bg-secondary/50 text-left text-muted-foreground">
              <th className="p-3">Nome</th><th className="p-3">Slug</th><th className="p-3">Status</th><th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {brands.map((b) => (
              <tr key={b.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{b.name}</td>
                <td className="p-3 text-muted-foreground">{b.slug}</td>
                <td className="p-3"><Badge variant={b.status ? "success" : "secondary"}>{b.status ? "Ativa" : "Inativa"}</Badge></td>
                <td className="p-3 text-right">
                  <button onClick={() => { setEditing(b); setOpen(true); }} className="mr-3 text-primary"><Pencil className="h-4 w-4 inline" /></button>
                  <button
                    onClick={() => startTransition(async () => {
                      const result = await deleteBrandAction(b.id);
                      if (result.success) { toast.success("Excluída."); router.refresh(); } else toast.error(result.message);
                    })}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

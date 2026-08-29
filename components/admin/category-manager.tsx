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
import { saveCategoryAction, deleteCategoryAction } from "@/actions/admin/taxonomy.actions";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  status: boolean;
  order: number;
  parentId: string | null;
}

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    const payload = {
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      description: String(formData.get("description") ?? ""),
      imageUrl: String(formData.get("imageUrl") ?? ""),
      seoTitle: "",
      seoDescription: "",
      status: formData.get("status") === "on",
      order: Number(formData.get("order") ?? 0),
      parentId: String(formData.get("parentId") ?? "") || null,
    };
    startTransition(async () => {
      const result = await saveCategoryAction(editing?.id ?? null, payload);
      if (result.success) {
        toast.success("Categoria salva.");
        setOpen(false);
        setEditing(null);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
        <DialogTrigger asChild>
          <Button onClick={() => setEditing(null)}><Plus className="h-4 w-4" /> Nova categoria</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Nova"} categoria</DialogTitle></DialogHeader>
          <form action={handleSubmit} className="space-y-3">
            <div className="space-y-1.5"><Label>Nome</Label><Input name="name" defaultValue={editing?.name} required /></div>
            <div className="space-y-1.5"><Label>Slug (opcional)</Label><Input name="slug" defaultValue={editing?.slug} placeholder="gerado automaticamente" /></div>
            <div className="space-y-1.5"><Label>Descrição</Label><Textarea name="description" defaultValue={editing?.description ?? ""} rows={3} /></div>
            <div className="space-y-1.5"><Label>URL da imagem</Label><Input name="imageUrl" defaultValue={editing?.imageUrl ?? ""} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Categoria pai (opcional)</Label>
                <select name="parentId" defaultValue={editing?.parentId ?? ""} className="w-full rounded-lg border px-3 py-2 text-sm">
                  <option value="">Nenhuma</option>
                  {categories.filter((c) => c.id !== editing?.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5"><Label>Ordem</Label><Input name="order" type="number" defaultValue={editing?.order ?? 0} /></div>
            </div>
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
            {categories.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 text-muted-foreground">{c.slug}</td>
                <td className="p-3"><Badge variant={c.status ? "success" : "secondary"}>{c.status ? "Ativa" : "Inativa"}</Badge></td>
                <td className="p-3 text-right">
                  <button onClick={() => { setEditing(c); setOpen(true); }} className="mr-3 text-primary"><Pencil className="h-4 w-4 inline" /></button>
                  <button
                    onClick={() => startTransition(async () => {
                      const result = await deleteCategoryAction(c.id);
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

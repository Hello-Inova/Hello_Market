"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { saveBannerContentAction, deleteBannerAction } from "@/actions/admin/content.actions";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrlDesktop: string;
  imageUrlMobile: string | null;
  buttonText: string | null;
  link: string | null;
  position: string;
  order: number;
  active: boolean;
}

const POSITIONS = [
  { value: "home_hero", label: "Home — Destaque principal" },
  { value: "home_secondary", label: "Home — Secundário" },
  { value: "category_top", label: "Categoria — Topo" },
];

export function BannerManager({ banners }: { banners: Banner[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    const payload = {
      title: String(formData.get("title") ?? ""),
      subtitle: String(formData.get("subtitle") ?? ""),
      imageUrlDesktop: String(formData.get("imageUrlDesktop") ?? ""),
      imageUrlMobile: String(formData.get("imageUrlMobile") ?? ""),
      buttonText: String(formData.get("buttonText") ?? ""),
      link: String(formData.get("link") ?? ""),
      position: String(formData.get("position") ?? "home_hero"),
      order: Number(formData.get("order") ?? 0),
      active: formData.get("active") === "on",
      startsAt: null,
      endsAt: null,
    };
    startTransition(async () => {
      const result = await saveBannerContentAction(editing?.id ?? null, payload);
      if (result.success) {
        toast.success("Banner salvo.");
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
          <Button onClick={() => setEditing(null)}><Plus className="h-4 w-4" /> Novo banner</Button>
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} banner</DialogTitle></DialogHeader>
          <form action={handleSubmit} className="space-y-3">
            <div className="space-y-1.5"><Label>Título</Label><Input name="title" defaultValue={editing?.title} required /></div>
            <div className="space-y-1.5"><Label>Subtítulo</Label><Textarea name="subtitle" defaultValue={editing?.subtitle ?? ""} rows={2} /></div>
            <div className="space-y-1.5"><Label>URL da imagem (desktop)</Label><Input name="imageUrlDesktop" defaultValue={editing?.imageUrlDesktop} required /></div>
            <div className="space-y-1.5"><Label>URL da imagem (mobile)</Label><Input name="imageUrlMobile" defaultValue={editing?.imageUrlMobile ?? ""} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Texto do botão</Label><Input name="buttonText" defaultValue={editing?.buttonText ?? ""} /></div>
              <div className="space-y-1.5"><Label>Link</Label><Input name="link" defaultValue={editing?.link ?? ""} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Posição</Label>
                <select name="position" defaultValue={editing?.position ?? "home_hero"} className="w-full rounded-lg border px-3 py-2 text-sm">
                  {POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5"><Label>Ordem</Label><Input name="order" type="number" defaultValue={editing?.order ?? 0} /></div>
            </div>
            <label className="flex items-center gap-3"><Switch name="active" defaultChecked={editing?.active ?? true} /><span className="text-sm">Ativo</span></label>
            <Button type="submit" disabled={isPending} className="w-full">{isPending ? "Salvando..." : "Salvar"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {banners.map((b) => (
          <div key={b.id} className="overflow-hidden rounded-xl border bg-white">
            <div className="relative aspect-[16/7] bg-secondary">
              <Image src={b.imageUrlDesktop} alt={b.title} fill className="object-cover" unoptimized />
            </div>
            <div className="space-y-1 p-3">
              <div className="flex items-center justify-between">
                <p className="truncate font-medium">{b.title}</p>
                <Badge variant={b.active ? "success" : "secondary"}>{b.active ? "Ativo" : "Inativo"}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{POSITIONS.find((p) => p.value === b.position)?.label ?? b.position} — ordem {b.order}</p>
              <div className="flex gap-3 pt-1 text-sm">
                <button onClick={() => { setEditing(b); setOpen(true); }} className="flex items-center gap-1 text-primary"><Pencil className="h-3.5 w-3.5" /> Editar</button>
                <button
                  onClick={() => startTransition(async () => {
                    const result = await deleteBannerAction(b.id);
                    if (result.success) { toast.success("Excluído."); router.refresh(); } else toast.error(result.message);
                  })}
                  className="flex items-center gap-1 text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                </button>
              </div>
            </div>
          </div>
        ))}
        {banners.length === 0 && <p className="col-span-full rounded-xl border bg-white p-6 text-center text-sm text-muted-foreground">Nenhum banner cadastrado.</p>}
      </div>
    </div>
  );
}

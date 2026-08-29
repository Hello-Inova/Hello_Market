"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { savePageAction, deletePageAction } from "@/actions/admin/content.actions";

interface CmsPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  seoTitle: string | null;
  seoDescription: string | null;
  published: boolean;
}

export function PageManager({ pages }: { pages: CmsPage[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CmsPage | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    const payload = {
      slug: String(formData.get("slug") ?? ""),
      title: String(formData.get("title") ?? ""),
      content: String(formData.get("content") ?? ""),
      seoTitle: String(formData.get("seoTitle") ?? ""),
      seoDescription: String(formData.get("seoDescription") ?? ""),
      published: formData.get("published") === "on",
    };
    startTransition(async () => {
      const result = await savePageAction(editing?.id ?? null, payload);
      if (result.success) {
        toast.success("Página salva.");
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
          <Button onClick={() => setEditing(null)}><Plus className="h-4 w-4" /> Nova página</Button>
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Nova"} página</DialogTitle></DialogHeader>
          <form action={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Título</Label><Input name="title" defaultValue={editing?.title} required /></div>
              <div className="space-y-1.5"><Label>Slug</Label><Input name="slug" defaultValue={editing?.slug} required /></div>
            </div>
            <div className="space-y-1.5"><Label>Conteúdo (HTML/Markdown)</Label><Textarea name="content" defaultValue={editing?.content ?? ""} rows={10} required /></div>
            <div className="space-y-1.5"><Label>SEO — título</Label><Input name="seoTitle" defaultValue={editing?.seoTitle ?? ""} /></div>
            <div className="space-y-1.5"><Label>SEO — descrição</Label><Textarea name="seoDescription" defaultValue={editing?.seoDescription ?? ""} rows={2} /></div>
            <label className="flex items-center gap-3"><Switch name="published" defaultChecked={editing?.published ?? true} /><span className="text-sm">Publicada</span></label>
            <Button type="submit" disabled={isPending} className="w-full">{isPending ? "Salvando..." : "Salvar"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="table-scroll rounded-xl border bg-white">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b bg-secondary/50 text-left text-muted-foreground">
              <th className="p-3">Título</th><th className="p-3">Slug</th><th className="p-3">Status</th><th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{p.title}</td>
                <td className="p-3 text-muted-foreground">/paginas/{p.slug}</td>
                <td className="p-3"><Badge variant={p.published ? "success" : "secondary"}>{p.published ? "Publicada" : "Rascunho"}</Badge></td>
                <td className="p-3 text-right">
                  <a href={`/paginas/${p.slug}`} target="_blank" rel="noopener noreferrer" className="mr-3 text-primary"><ExternalLink className="h-4 w-4 inline" /></a>
                  <button onClick={() => { setEditing(p); setOpen(true); }} className="mr-3 text-primary"><Pencil className="h-4 w-4 inline" /></button>
                  <button
                    onClick={() => startTransition(async () => {
                      const result = await deletePageAction(p.id);
                      if (result.success) { toast.success("Excluída."); router.refresh(); } else toast.error(result.message);
                    })}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
            {pages.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Nenhuma página cadastrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

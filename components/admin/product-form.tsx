"use client";

import { useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { saveProductAction } from "@/actions/admin/product.actions";

interface ImageRow {
  id?: string;
  url: string;
  altText: string;
}

interface VariantRow {
  id?: string;
  sku: string;
  name: string;
  optionsText: string; // "Cor:Azul, Tamanho:M"
  price: string;
  stock: string;
  imageUrl: string;
  active: boolean;
}

interface Props {
  product?: {
    id: string;
    name: string;
    sku: string;
    shortDescription: string;
    description: string;
    price: number;
    compareAtPrice: number | null;
    costPrice: number | null;
    stock: number;
    minStock: number;
    weightKg: number | null;
    heightCm: number | null;
    widthCm: number | null;
    lengthCm: number | null;
    categoryId: string | null;
    brandId: string | null;
    tags: string[];
    status: string;
    featured: boolean;
    type: string;
    seoTitle: string;
    seoDescription: string;
    images: ImageRow[];
    variants: (VariantRow & { id: string })[];
  };
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
}

export function ProductForm({ product, categories, brands }: Props) {
  const router = useRouter();
  const { companySlug } = useParams<{ companySlug: string }>();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(product?.name ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [shortDescription, setShortDescription] = useState(product?.shortDescription ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(String(product?.price ?? ""));
  const [compareAtPrice, setCompareAtPrice] = useState(product?.compareAtPrice ? String(product.compareAtPrice) : "");
  const [costPrice, setCostPrice] = useState(product?.costPrice ? String(product.costPrice) : "");
  const [stock, setStock] = useState(String(product?.stock ?? "0"));
  const [minStock, setMinStock] = useState(String(product?.minStock ?? "5"));
  const [weightKg, setWeightKg] = useState(product?.weightKg ? String(product.weightKg) : "");
  const [heightCm, setHeightCm] = useState(product?.heightCm ? String(product.heightCm) : "");
  const [widthCm, setWidthCm] = useState(product?.widthCm ? String(product.widthCm) : "");
  const [lengthCm, setLengthCm] = useState(product?.lengthCm ? String(product.lengthCm) : "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [brandId, setBrandId] = useState(product?.brandId ?? "");
  const [tags, setTags] = useState(product?.tags.join(", ") ?? "");
  const [status, setStatus] = useState(product?.status ?? "ACTIVE");
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [type, setType] = useState(product?.type ?? "PHYSICAL");
  const [seoTitle, setSeoTitle] = useState(product?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(product?.seoDescription ?? "");
  const [images, setImages] = useState<ImageRow[]>(product?.images ?? []);
  const [variants, setVariants] = useState<VariantRow[]>(product?.variants ?? []);

  function addImage() {
    setImages((prev) => [...prev, { url: "", altText: "" }]);
  }
  function updateImage(idx: number, field: keyof ImageRow, value: string) {
    setImages((prev) => prev.map((img, i) => (i === idx ? { ...img, [field]: value } : img)));
  }
  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  function addVariant() {
    setVariants((prev) => [
      ...prev,
      { sku: "", name: "", optionsText: "", price: "", stock: "0", imageUrl: "", active: true },
    ]);
  }
  function updateVariant(idx: number, field: keyof VariantRow, value: string | boolean) {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v)));
  }
  function removeVariant(idx: number) {
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  }

  function parseOptions(text: string): Record<string, string> {
    const result: Record<string, string> = {};
    for (const pair of text.split(",")) {
      const [key, value] = pair.split(":").map((s) => s.trim());
      if (key && value) result[key] = value;
    }
    return result;
  }

  function handleSubmit() {
    const payload = {
      name,
      sku,
      shortDescription,
      description,
      price: parseFloat(price) || 0,
      compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
      costPrice: costPrice ? parseFloat(costPrice) : null,
      stock: parseInt(stock) || 0,
      minStock: parseInt(minStock) || 0,
      weightKg: weightKg ? parseFloat(weightKg) : null,
      heightCm: heightCm ? parseFloat(heightCm) : null,
      widthCm: widthCm ? parseFloat(widthCm) : null,
      lengthCm: lengthCm ? parseFloat(lengthCm) : null,
      categoryId: categoryId || null,
      brandId: brandId || null,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      status,
      featured,
      type,
      seoTitle,
      seoDescription,
      images: images.filter((i) => i.url).map((i, idx) => ({ url: i.url, altText: i.altText, order: idx, variantId: null })),
      variants: variants
        .filter((v) => v.sku && v.name)
        .map((v) => ({
          id: v.id,
          sku: v.sku,
          name: v.name,
          options: parseOptions(v.optionsText),
          price: v.price ? parseFloat(v.price) : null,
          compareAtPrice: null,
          stock: parseInt(v.stock) || 0,
          weightKg: null,
          imageUrl: v.imageUrl || null,
          active: v.active,
        })),
    };

    startTransition(async () => {
      const result = await saveProductAction(product?.id ?? null, payload);
      if (result.success) {
        toast.success("Produto salvo com sucesso!");
        router.push(`/admin/${companySlug}/produtos`);
        router.refresh();
      } else {
        toast.error(result.message || "Não foi possível salvar o produto.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="geral">
        <TabsList>
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="imagens">Imagens</TabsTrigger>
          <TabsTrigger value="variacoes">Variações</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Informações básicas</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome do produto" value={name} onChange={setName} required />
                <Field label="SKU" value={sku} onChange={setSku} required />
              </div>
              <div className="space-y-1.5">
                <Label>Descrição curta</Label>
                <Textarea value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Descrição completa</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Preço e estoque</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <Field label="Preço" value={price} onChange={setPrice} type="number" required />
              <Field label="Preço promocional (de)" value={compareAtPrice} onChange={setCompareAtPrice} type="number" />
              <Field label="Custo" value={costPrice} onChange={setCostPrice} type="number" />
              <Field label="Estoque" value={stock} onChange={setStock} type="number" />
              <Field label="Estoque mínimo" value={minStock} onChange={setMinStock} type="number" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Dimensões e peso</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-4">
              <Field label="Peso (kg)" value={weightKg} onChange={setWeightKg} type="number" />
              <Field label="Altura (cm)" value={heightCm} onChange={setHeightCm} type="number" />
              <Field label="Largura (cm)" value={widthCm} onChange={setWidthCm} type="number" />
              <Field label="Comprimento (cm)" value={lengthCm} onChange={setLengthCm} type="number" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Organização</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Categoria</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Marca</Label>
                  <Select value={brandId} onValueChange={setBrandId}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Field label="Tags (separadas por vírgula)" value={tags} onChange={setTags} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Rascunho</SelectItem>
                      <SelectItem value="ACTIVE">Ativo</SelectItem>
                      <SelectItem value="INACTIVE">Inativo</SelectItem>
                      <SelectItem value="ARCHIVED">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PHYSICAL">Físico</SelectItem>
                      <SelectItem value="DIGITAL">Digital</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <label className="flex items-center gap-3">
                <Switch checked={featured} onCheckedChange={setFeatured} />
                <span className="text-sm">Produto em destaque</span>
              </label>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imagens">
          <Card>
            <CardHeader><CardTitle>Imagens do produto</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {images.map((img, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-secondary">
                    {img.url && <Image src={img.url} alt="" fill className="object-cover" sizes="56px" />}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input placeholder="URL da imagem" value={img.url} onChange={(e) => updateImage(idx, "url", e.target.value)} />
                    <Input placeholder="Texto alternativo (alt)" value={img.altText} onChange={(e) => updateImage(idx, "altText", e.target.value)} />
                  </div>
                  <button onClick={() => removeImage(idx)}><Trash2 className="h-4 w-4 text-destructive" /></button>
                </div>
              ))}
              <Button variant="outline" onClick={addImage}><Plus className="h-4 w-4" /> Adicionar imagem (URL)</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variacoes">
          <Card>
            <CardHeader>
              <CardTitle>Variações</CardTitle>
              <p className="text-sm text-muted-foreground">Ex: opções no formato Cor:Azul, Tamanho:M</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {variants.map((v, idx) => (
                <div key={idx} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-6">
                  <Input placeholder="SKU" value={v.sku} onChange={(e) => updateVariant(idx, "sku", e.target.value)} />
                  <Input placeholder="Nome (ex: Azul / M)" value={v.name} onChange={(e) => updateVariant(idx, "name", e.target.value)} />
                  <Input placeholder="Opções: Cor:Azul, Tamanho:M" value={v.optionsText} onChange={(e) => updateVariant(idx, "optionsText", e.target.value)} className="sm:col-span-2" />
                  <Input placeholder="Preço (opcional)" type="number" value={v.price} onChange={(e) => updateVariant(idx, "price", e.target.value)} />
                  <Input placeholder="Estoque" type="number" value={v.stock} onChange={(e) => updateVariant(idx, "stock", e.target.value)} />
                  <div className="flex items-center gap-2 sm:col-span-6">
                    <Input placeholder="URL da imagem da variação (opcional)" value={v.imageUrl} onChange={(e) => updateVariant(idx, "imageUrl", e.target.value)} className="flex-1" />
                    <button onClick={() => removeVariant(idx)}><Trash2 className="h-4 w-4 text-destructive" /></button>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addVariant}><Plus className="h-4 w-4" /> Adicionar variação</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader><CardTitle>SEO</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Meta título" value={seoTitle} onChange={setSeoTitle} />
              <div className="space-y-1.5">
                <Label>Meta descrição</Label>
                <Textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows={3} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push(`/admin/${companySlug}/produtos`)}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar produto"}
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} step={type === "number" ? "0.01" : undefined} />
    </div>
  );
}

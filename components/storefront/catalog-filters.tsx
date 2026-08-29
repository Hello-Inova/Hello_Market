"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  categories: { id: string; name: string; slug: string; parentId: string | null }[];
  brands: { id: string; name: string; slug: string }[];
  searchParams: Record<string, string | string[] | undefined>;
}

export function CatalogFiltersSidebar({ categories, brands, searchParams }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [minPrice, setMinPrice] = useState((searchParams.min as string) || "");
  const [maxPrice, setMaxPrice] = useState((searchParams.max as string) || "");

  function updateParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
    next.delete("pagina");
    router.push(`${pathname}?${next.toString()}`);
  }

  function toggleParam(key: string) {
    updateParam(key, params.get(key) === "1" ? null : "1");
  }

  const rootCategories = categories.filter((c) => !c.parentId);

  return (
    <div className="space-y-6 text-sm">
      <div>
        <h3 className="mb-2 font-semibold">Categoria</h3>
        <ul className="space-y-1.5">
          {rootCategories.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => updateParam("categoria", params.get("categoria") === c.slug ? null : c.slug)}
                className={`text-left hover:text-primary ${params.get("categoria") === c.slug ? "font-semibold text-primary" : "text-muted-foreground"}`}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {brands.length > 0 && (
        <div>
          <h3 className="mb-2 font-semibold">Marca</h3>
          <ul className="space-y-1.5">
            {brands.map((b) => (
              <li key={b.id}>
                <button
                  onClick={() => updateParam("marca", params.get("marca") === b.slug ? null : b.slug)}
                  className={`text-left hover:text-primary ${params.get("marca") === b.slug ? "font-semibold text-primary" : "text-muted-foreground"}`}
                >
                  {b.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="mb-2 font-semibold">Preço</h3>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Mín"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            type="number"
            className="h-9"
          />
          <span>–</span>
          <Input
            placeholder="Máx"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            type="number"
            className="h-9"
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          className="mt-2 w-full"
          onClick={() => {
            updateParam("min", minPrice);
            updateParam("max", maxPrice);
          }}
        >
          Aplicar
        </Button>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <Checkbox checked={params.get("disponivel") === "1"} onCheckedChange={() => toggleParam("disponivel")} />
          Somente disponíveis
        </label>
        <label className="flex items-center gap-2">
          <Checkbox checked={params.get("promocao") === "1"} onCheckedChange={() => toggleParam("promocao")} />
          Somente promoções
        </label>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Avaliação mínima</h3>
        <ul className="space-y-1.5">
          {[4, 3, 2, 1].map((r) => (
            <li key={r}>
              <button
                onClick={() => updateParam("avaliacao", params.get("avaliacao") === String(r) ? null : String(r))}
                className={`text-left hover:text-primary ${params.get("avaliacao") === String(r) ? "font-semibold text-primary" : "text-muted-foreground"}`}
              >
                {r}+ estrelas
              </button>
            </li>
          ))}
        </ul>
      </div>

      <Button variant="ghost" size="sm" className="w-full" onClick={() => router.push(pathname)}>
        Limpar filtros
      </Button>
    </div>
  );
}

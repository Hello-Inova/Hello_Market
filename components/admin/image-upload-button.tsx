"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadProductImageAction } from "@/actions/admin/upload.actions";

interface Props {
  onUploaded: (url: string) => void;
  label?: string;
  className?: string;
  size?: "default" | "sm";
}

// Botão de upload de imagem reaproveitável — usado na lista de imagens do
// produto e na imagem de cada variação. Faz o upload assim que o arquivo é
// escolhido (sem passo extra de "confirmar") e devolve a URL via
// onUploaded, que quem chama decide onde encaixar (novo item da lista,
// campo de um item existente, etc).
export function ImageUploadButton({ onUploaded, label = "Enviar do computador", className, size = "sm" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite escolher o mesmo arquivo de novo depois
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadProductImageAction(formData);
    setIsUploading(false);

    if (result.success && result.url) {
      onUploaded(result.url);
      toast.success("Imagem enviada.");
    } else {
      toast.error(result.message ?? "Não foi possível enviar a imagem.");
    }
  }

  return (
    <>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="hidden" onChange={handleChange} />
      <Button
        type="button"
        variant="outline"
        size={size}
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
        className={className}
      >
        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {isUploading ? "Enviando..." : label}
      </Button>
    </>
  );
}

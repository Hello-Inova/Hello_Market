"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Star, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createAddressAction,
  updateAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
} from "@/actions/address.actions";

export interface AddressData {
  id: string;
  label: string;
  type: string;
  recipient: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  reference: string | null;
  isDefault: boolean;
}

export function AddressManager({ addresses }: { addresses: AddressData[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AddressData | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = editing
        ? await updateAddressAction(editing.id, formData)
        : await createAddressAction(formData);
      if (result.success) {
        toast.success("Endereço salvo com sucesso.");
        setOpen(false);
        setEditing(null);
      } else {
        toast.error(result.message || "Não foi possível salvar.");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteAddressAction(id);
      if (result.success) toast.success("Endereço removido.");
      else toast.error(result.message);
    });
  }

  function handleSetDefault(id: string) {
    startTransition(async () => {
      await setDefaultAddressAction(id);
      toast.success("Endereço padrão atualizado.");
    });
  }

  return (
    <div className="space-y-4">
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setEditing(null);
        }}
      >
        <DialogTrigger asChild>
          <Button onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" /> Novo endereço
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar endereço" : "Novo endereço"}</DialogTitle>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nome do endereço" name="label" defaultValue={editing?.label} required />
              <Field label="Destinatário" name="recipient" defaultValue={editing?.recipient} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="CEP" name="zipCode" defaultValue={editing?.zipCode} required />
              <Field label="Número" name="number" defaultValue={editing?.number} required />
            </div>
            <Field label="Rua" name="street" defaultValue={editing?.street} required />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Bairro" name="neighborhood" defaultValue={editing?.neighborhood} required />
              <Field label="Complemento" name="complement" defaultValue={editing?.complement ?? ""} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cidade" name="city" defaultValue={editing?.city} required />
              <Field label="Estado (UF)" name="state" defaultValue={editing?.state} maxLength={2} required />
            </div>
            <Field label="Referência" name="reference" defaultValue={editing?.reference ?? ""} />
            <input type="hidden" name="country" value="Brasil" />
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <select name="type" defaultValue={editing?.type ?? "RESIDENTIAL"} className="w-full rounded-lg border px-3 py-2 text-sm">
                <option value="RESIDENTIAL">Residencial</option>
                <option value="COMMERCIAL">Comercial</option>
                <option value="OTHER">Outro</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isDefault" defaultChecked={editing?.isDefault} /> Definir como padrão
            </label>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {addresses.length === 0 ? (
        <p className="text-sm text-muted-foreground">Você ainda não cadastrou nenhum endereço.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((addr) => (
            <div key={addr.id} className="rounded-xl border p-4">
              <div className="mb-1 flex items-center justify-between">
                <p className="font-medium">{addr.label}</p>
                {addr.isDefault && (
                  <span className="flex items-center gap-1 text-xs text-primary">
                    <Star className="h-3 w-3 fill-primary" /> Padrão
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {addr.recipient} — {addr.street}, {addr.number}
                {addr.complement ? `, ${addr.complement}` : ""}
              </p>
              <p className="text-sm text-muted-foreground">
                {addr.neighborhood}, {addr.city}/{addr.state} — {addr.zipCode}
              </p>
              <div className="mt-3 flex gap-3 text-sm">
                <button
                  onClick={() => {
                    setEditing(addr);
                    setOpen(true);
                  }}
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </button>
                {!addr.isDefault && (
                  <button onClick={() => handleSetDefault(addr.id)} className="text-primary hover:underline">
                    Tornar padrão
                  </button>
                )}
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="flex items-center gap-1 text-destructive hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  maxLength,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue} required={required} maxLength={maxLength} />
    </div>
  );
}

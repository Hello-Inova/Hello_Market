"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateProfileAction } from "@/actions/profile.actions";
import { formatCpfCnpj } from "@/lib/validators";

interface Props {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    document: string | null;
    phone: string | null;
    birthDate: string | null;
    avatarUrl: string | null;
  };
}

export function ProfileForm({ user }: Props) {
  const [isPending, startTransition] = useTransition();
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          const result = await updateProfileAction(formData);
          if (result.success) toast.success(result.message);
          else toast.error(result.message);
        });
      }}
      className="space-y-5"
    >
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={avatarUrl} alt={user.firstName} />
          <AvatarFallback className="text-lg">{user.firstName[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="avatarUrl">URL da foto de perfil</Label>
          <Input
            id="avatarUrl"
            name="avatarUrl"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">Nome</Label>
          <Input id="firstName" name="firstName" defaultValue={user.firstName} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Sobrenome</Label>
          <Input id="lastName" name="lastName" defaultValue={user.lastName} required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>E-mail</Label>
        <Input value={user.email} disabled className="bg-secondary" />
        <p className="text-xs text-muted-foreground">
          Para alterar seu e-mail, acesse a seção Segurança.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="document">CPF/CNPJ</Label>
          <Input id="document" name="document" defaultValue={user.document ? formatCpfCnpj(user.document) : ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" name="phone" defaultValue={user.phone ?? ""} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="birthDate">Data de nascimento</Label>
        <Input id="birthDate" name="birthDate" type="date" defaultValue={user.birthDate ?? ""} />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}

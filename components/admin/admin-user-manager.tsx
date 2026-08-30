"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/utils";
import { saveAdminUserAction, toggleAdminUserActiveAction, deleteAdminUserAction } from "@/actions/admin/user.actions";
import { ALL_PERMISSIONS, ROLE_PERMISSIONS, type Permission } from "@/lib/permissions";

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "GERENTE" | "OPERADOR";
  permissions: string[];
  active: boolean;
  lastLoginAt: string | null;
}

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrador",
  GERENTE: "Gerente",
  OPERADOR: "Operador",
};

export function AdminUserManager({ users, currentAdminId }: { users: AdminUserRow[]; currentAdminId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUserRow | null>(null);
  const [role, setRole] = useState<AdminUserRow["role"]>("OPERADOR");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  function openNew() {
    setEditing(null);
    setRole("OPERADOR");
    setPermissions([]);
    setOpen(true);
  }

  function openEdit(u: AdminUserRow) {
    setEditing(u);
    setRole(u.role);
    setPermissions(u.permissions);
    setOpen(true);
  }

  function togglePermission(p: string) {
    setPermissions((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  function handleSubmit(formData: FormData) {
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      role,
      permissions,
      active: formData.get("active") === "on" || !editing,
    };
    startTransition(async () => {
      const result = await saveAdminUserAction(editing?.id ?? null, payload);
      if (result.success) {
        toast.success("Usuário salvo.");
        setOpen(false);
        router.refresh();
      } else toast.error(result.message);
    });
  }

  const defaultPerms = ROLE_PERMISSIONS[role] ?? [];

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
        <DialogTrigger asChild>
          <Button onClick={openNew}><Plus className="h-4 w-4" /> Novo usuário</Button>
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} usuário admin</DialogTitle></DialogHeader>
          <form action={handleSubmit} className="space-y-3">
            <div className="space-y-1.5"><Label>Nome</Label><Input name="name" defaultValue={editing?.name} required /></div>
            <div className="space-y-1.5"><Label>E-mail</Label><Input name="email" type="email" defaultValue={editing?.email} required /></div>
            <div className="space-y-1.5">
              <Label>{editing ? "Nova senha (deixe em branco para manter)" : "Senha"}</Label>
              <PasswordInput name="password" required={!editing} />
            </div>
            <div className="space-y-1.5">
              <Label>Papel</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as AdminUserRow["role"])}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="OPERADOR">Operador</option>
                <option value="GERENTE">Gerente</option>
                <option value="ADMIN">Administrador</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
            {editing && (
              <label className="flex items-center gap-3"><Checkbox name="active" defaultChecked={editing.active} /><span className="text-sm">Ativo</span></label>
            )}
            <div className="space-y-1.5">
              <Label>Permissões adicionais (além das padrão do papel)</Label>
              <div className="grid max-h-48 grid-cols-2 gap-1.5 overflow-y-auto rounded-lg border p-2">
                {ALL_PERMISSIONS.map((p) => (
                  <label key={p} className="flex items-center gap-2 text-xs">
                    <Checkbox
                      checked={permissions.includes(p) || defaultPerms.includes(p as Permission)}
                      disabled={defaultPerms.includes(p as Permission) || role === "SUPER_ADMIN"}
                      onCheckedChange={() => togglePermission(p)}
                    />
                    {p}
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Permissões desabilitadas já fazem parte do papel selecionado.</p>
            </div>
            <Button type="submit" disabled={isPending} className="w-full">{isPending ? "Salvando..." : "Salvar"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="table-scroll rounded-xl border bg-white">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b bg-secondary/50 text-left text-muted-foreground">
              <th className="p-3">Nome</th><th className="p-3">E-mail</th><th className="p-3">Papel</th>
              <th className="p-3">Último acesso</th><th className="p-3">Status</th><th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{u.name} {u.id === currentAdminId && <span className="text-xs text-muted-foreground">(você)</span>}</td>
                <td className="p-3 text-muted-foreground">{u.email}</td>
                <td className="p-3"><Badge variant="outline">{ROLE_LABEL[u.role]}</Badge></td>
                <td className="p-3 text-muted-foreground">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Nunca"}</td>
                <td className="p-3"><Badge variant={u.active ? "success" : "secondary"}>{u.active ? "Ativo" : "Inativo"}</Badge></td>
                <td className="p-3 text-right">
                  <button onClick={() => openEdit(u)} className="mr-3 text-primary"><Pencil className="h-4 w-4 inline" /></button>
                  <button
                    disabled={u.id === currentAdminId}
                    onClick={() => startTransition(async () => {
                      const result = await toggleAdminUserActiveAction(u.id, !u.active);
                      if (result.success) { toast.success("Atualizado."); router.refresh(); } else toast.error(result.message);
                    })}
                    className="mr-3 text-amber-600 disabled:opacity-30"
                  >
                    <Power className="h-4 w-4 inline" />
                  </button>
                  <button
                    disabled={u.id === currentAdminId}
                    onClick={() => startTransition(async () => {
                      const result = await deleteAdminUserAction(u.id);
                      if (result.success) { toast.success("Excluído."); router.refresh(); } else toast.error(result.message);
                    })}
                    className="text-destructive disabled:opacity-30"
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

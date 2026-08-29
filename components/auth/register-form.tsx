"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { registerAction, type ActionResult } from "@/actions/auth.actions";
import { readGuestCart, clearGuestCart } from "@/lib/guest-cart";

const initialState: ActionResult = { success: false };

export function RegisterForm() {
  const router = useRouter();
  const { companySlug } = useParams<{ companySlug: string }>();
  const base = `/loja/${companySlug}`;
  const [state, formAction, isPending] = useActionState(registerAction, initialState);
  const guestCartRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (guestCartRef.current) {
      guestCartRef.current.value = JSON.stringify(readGuestCart());
    }
  }, []);

  useEffect(() => {
    if (state.success) {
      clearGuestCart();
      toast.success("Conta criada com sucesso!");
      router.push(`${base}/minha-conta`);
      router.refresh();
    } else if (state.message && !state.fieldErrors) {
      toast.error(state.message);
    }
  }, [state, router]);

  const err = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <h1 className="text-xl font-bold">Criar conta</h1>
        <p className="text-sm text-muted-foreground">Leva menos de um minuto.</p>
      </div>

      <input ref={guestCartRef} type="hidden" name="guestCart" defaultValue="" />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Nome" name="firstName" error={err.firstName} required />
        <Field label="Sobrenome" name="lastName" error={err.lastName} required />
      </div>
      <Field label="E-mail" name="email" type="email" error={err.email} required />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Telefone" name="phone" placeholder="(11) 91234-5678" error={err.phone} />
        <Field label="CPF/CNPJ" name="document" placeholder="000.000.000-00" error={err.document} />
      </div>
      <Field label="Data de nascimento" name="birthDate" type="date" error={err.birthDate} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Senha" name="password" type="password" error={err.password} required />
        <Field label="Confirmar senha" name="confirmPassword" type="password" error={err.confirmPassword} required />
      </div>

      <div className="space-y-2 pt-1">
        <label className="flex items-start gap-2 text-xs">
          <Checkbox name="acceptTerms" required className="mt-0.5" />
          <span>
            Li e aceito os{" "}
            <Link href={`${base}/paginas/termos`} target="_blank" className="text-primary hover:underline">
              Termos de Uso
            </Link>
          </span>
        </label>
        <label className="flex items-start gap-2 text-xs">
          <Checkbox name="acceptPrivacy" required className="mt-0.5" />
          <span>
            Li e aceito a{" "}
            <Link href={`${base}/paginas/privacidade`} target="_blank" className="text-primary hover:underline">
              Política de Privacidade
            </Link>
          </span>
        </label>
        <label className="flex items-start gap-2 text-xs">
          <Checkbox name="marketingOptIn" className="mt-0.5" />
          <span>Quero receber ofertas e novidades por e-mail</span>
        </label>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Criando conta..." : "Criar conta"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href={`${base}/entrar`} className="font-medium text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  error,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} placeholder={placeholder} aria-invalid={!!error} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, type ActionResult } from "@/actions/auth.actions";
import { readGuestCart, clearGuestCart } from "@/lib/guest-cart";

const initialState: ActionResult = { success: false };

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { companySlug } = useParams<{ companySlug: string }>();
  const base = `/loja/${companySlug}`;
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const guestCartRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Uncontrolled: written directly to the DOM (not via setState) so the
    // hidden field only ever reflects the client's localStorage snapshot,
    // read once after mount.
    if (guestCartRef.current) {
      guestCartRef.current.value = JSON.stringify(readGuestCart());
    }
  }, []);

  useEffect(() => {
    if (state.success) {
      clearGuestCart();
      const next = searchParams.get("next") || `${base}/minha-conta`;
      router.push(next);
      router.refresh();
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state, router, searchParams]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <h1 className="text-xl font-bold">Entrar na sua conta</h1>
        <p className="text-sm text-muted-foreground">Acesse pedidos, favoritos e muito mais.</p>
      </div>

      <input ref={guestCartRef} type="hidden" name="guestCart" defaultValue="" />

      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Senha</Label>
          <Link href={`${base}/esqueci-senha`} className="text-xs text-primary hover:underline">
            Esqueci minha senha
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Entrando..." : "Entrar"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Não tem conta?{" "}
        <Link href={`${base}/cadastro`} className="font-medium text-primary hover:underline">
          Criar conta
        </Link>
      </p>
    </form>
  );
}

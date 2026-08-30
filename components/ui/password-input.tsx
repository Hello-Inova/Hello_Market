"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface PasswordInputProps extends Omit<InputProps, "type"> {
  // Cor do botão de mostrar/ocultar — sobrescrita pelos formulários de tema
  // escuro (login admin/plataforma), que usam texto zinc claro em vez do
  // token padrão --muted-foreground.
  toggleClassName?: string;
}

// Campo de senha com botão de mostrar/ocultar (padrão Eye/EyeOff já usado em
// login-form.tsx e register-form.tsx do cliente) — centralizado aqui para
// reaproveitar em todo login, cadastro, redefinição e alteração de senha do
// sistema (cliente, admin de loja e plataforma).
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, toggleClassName, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);
    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn("pr-10", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground",
            toggleClassName
          )}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          tabIndex={-1}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };

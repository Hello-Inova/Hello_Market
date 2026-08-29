import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Redefinir senha" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Link inválido. Solicite uma nova recuperação de senha.
      </p>
    );
  }

  return <ResetPasswordForm token={token} />;
}

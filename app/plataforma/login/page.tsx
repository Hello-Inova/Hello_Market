import { redirect } from "next/navigation";
import { getCurrentPlatformAdmin } from "@/lib/auth/platform-session";
import { PlatformLoginForm } from "@/components/platform/platform-login-form";

export default async function PlatformLoginPage() {
  // Sessão já válida -- manda direto pro dashboard em vez de deixar o
  // layout renderizar o PlatformShell autenticado por cima do formulário.
  const admin = await getCurrentPlatformAdmin();
  if (admin) redirect("/plataforma");

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-white sm:p-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-icon.png" alt="Hello Inova" className="mb-4 h-10 w-10" />
        <h1 className="mb-1 text-xl font-bold">Plataforma Hello Inova</h1>
        <p className="mb-6 text-sm text-zinc-400">Painel do Super Admin — gestão de todas as empresas</p>
        <PlatformLoginForm />
        <p className="mt-4 text-xs text-zinc-500">Acesso restrito à equipe da Hello Inova.</p>
      </div>
    </div>
  );
}

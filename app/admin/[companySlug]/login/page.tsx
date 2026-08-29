import { AdminLoginForm } from "@/components/admin/admin-login-form";

export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-white">
        <h1 className="mb-1 text-xl font-bold">Painel Administrativo</h1>
        <p className="mb-6 text-sm text-zinc-400">Hello Market</p>
        <AdminLoginForm companySlug={companySlug} />
        <p className="mt-4 text-xs text-zinc-500">
          Acesso restrito à equipe administrativa. Demo: admin@hellomarket.com.br / Admin@123
        </p>
      </div>
    </div>
  );
}

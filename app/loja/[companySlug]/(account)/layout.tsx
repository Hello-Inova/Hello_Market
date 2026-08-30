import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AccountNav } from "@/components/account/account-nav";

export default async function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  const base = `/loja/${companySlug}`;
  const user = await getCurrentUser();
  if (!user) redirect(`${base}/entrar?next=${base}/minha-conta`);

  return (
    // O <aside> de AccountNav agora é `fixed` na borda esquerda da tela
    // (ver comentário em components/account/account-nav.tsx) em vez de
    // uma coluna de grid — por isso este wrapper só precisa do
    // padding-left (md:pl-64, mesma largura do aside) para o conteúdo não
    // ficar embaixo dele; container-page continua centralizando o
    // conteúdo dentro do espaço restante.
    <div className="py-6">
      <AccountNav base={base} userName={user.fullName} userEmail={user.email} />
      <div className="container-page min-w-0 md:pl-64">{children}</div>
    </div>
  );
}

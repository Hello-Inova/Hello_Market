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
    <div className="container-page grid gap-8 py-6 md:grid-cols-[240px_1fr]">
      <AccountNav base={base} userName={user.fullName} userEmail={user.email} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

import Link from "next/link";

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/40 p-4">
      <Link href={`/loja/${companySlug}`} className="mb-6 text-2xl font-bold text-primary">
        Hello Market
      </Link>
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm sm:p-8">{children}</div>
    </div>
  );
}

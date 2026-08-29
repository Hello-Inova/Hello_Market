import { redirect } from "next/navigation";

export default async function SearchRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ companySlug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { companySlug } = await params;
  const { q } = await searchParams;
  redirect(`/loja/${companySlug}/produtos?q=${encodeURIComponent(q ?? "")}`);
}

import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import { requirePermission } from "@/lib/auth/admin-session";
import { getStoreSettings } from "@/services/settings.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = { title: "Configurações" };

function IntegrationRow({ label, active, detail }: { label: string; active: boolean; detail: string }) {
  return (
    <div className="flex items-center justify-between border-b py-2 text-sm last:border-0">
      <div className="flex items-center gap-2">
        {active ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}
        <span className="font-medium">{label}</span>
      </div>
      <Badge variant={active ? "success" : "outline"}>{detail}</Badge>
    </div>
  );
}

export default async function AdminSettingsPage() {
  await requirePermission("settings.manage");
  const settings = await getStoreSettings();

  const paymentProvider = (process.env.PAYMENT_PROVIDER || "mock").toLowerCase();
  const emailProvider = (process.env.EMAIL_PROVIDER || "console").toLowerCase();
  const shippingProvider = (process.env.SHIPPING_PROVIDER || "mock").toLowerCase();
  const storageProvider = (process.env.STORAGE_PROVIDER || "url").toLowerCase();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <Card>
        <CardHeader><CardTitle>Integrações</CardTitle></CardHeader>
        <CardContent>
          <IntegrationRow label="Pagamentos" active={paymentProvider !== "mock"} detail={paymentProvider === "mock" ? "Modo demo (Mock)" : paymentProvider} />
          <IntegrationRow label="E-mail transacional" active={emailProvider !== "console"} detail={emailProvider === "console" ? "Modo demo (Console)" : emailProvider} />
          <IntegrationRow label="Frete" active={shippingProvider !== "mock"} detail={shippingProvider === "mock" ? "Modo demo (Mock)" : shippingProvider} />
          <IntegrationRow label="Armazenamento de imagens" active={storageProvider !== "url"} detail={storageProvider === "url" ? "Somente URL" : storageProvider} />
          <p className="mt-3 text-xs text-muted-foreground">
            Todas as integrações usam implementações reais quando as variáveis de ambiente correspondentes (ver .env.example) estão configuradas,
            e caem automaticamente para um modo demo/mock quando não estão — o sistema nunca fica indisponível por falta de credenciais.
          </p>
        </CardContent>
      </Card>

      <SettingsForm settings={settings} />
    </div>
  );
}

"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateStoreSettingsAction } from "@/actions/admin/settings.actions";
import type { StoreSettings } from "@/services/settings.service";

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      whatsapp: String(formData.get("whatsapp") ?? ""),
      address: String(formData.get("address") ?? ""),
      cnpj: String(formData.get("cnpj") ?? ""),
      logoUrl: String(formData.get("logoUrl") ?? ""),
      instagram: String(formData.get("instagram") ?? ""),
      facebook: String(formData.get("facebook") ?? ""),
      tiktok: String(formData.get("tiktok") ?? ""),
      youtube: String(formData.get("youtube") ?? ""),
      guestCheckout: formData.get("guestCheckout") === "on",
      minOrderValue: Number(formData.get("minOrderValue") ?? 0),
      freeShippingThreshold: Number(formData.get("freeShippingThreshold") ?? 0),
    };
    startTransition(async () => {
      const result = await updateStoreSettingsAction(payload);
      if (result.success) toast.success("Configurações salvas.");
      else toast.error(result.message);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Dados da loja</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Nome da loja</Label><Input name="name" defaultValue={settings.name} /></div>
          <div className="space-y-1.5"><Label>CNPJ</Label><Input name="cnpj" defaultValue={settings.cnpj ?? ""} /></div>
          <div className="space-y-1.5"><Label>E-mail de contato</Label><Input name="email" type="email" defaultValue={settings.email ?? ""} /></div>
          <div className="space-y-1.5"><Label>Telefone</Label><Input name="phone" defaultValue={settings.phone ?? ""} /></div>
          <div className="space-y-1.5"><Label>WhatsApp</Label><Input name="whatsapp" defaultValue={settings.whatsapp ?? ""} /></div>
          <div className="space-y-1.5"><Label>URL do logo</Label><Input name="logoUrl" defaultValue={settings.logoUrl ?? ""} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Endereço</Label><Textarea name="address" defaultValue={settings.address ?? ""} rows={2} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Redes sociais</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Instagram</Label><Input name="instagram" defaultValue={settings.social.instagram ?? ""} /></div>
          <div className="space-y-1.5"><Label>Facebook</Label><Input name="facebook" defaultValue={settings.social.facebook ?? ""} /></div>
          <div className="space-y-1.5"><Label>TikTok</Label><Input name="tiktok" defaultValue={settings.social.tiktok ?? ""} /></div>
          <div className="space-y-1.5"><Label>YouTube</Label><Input name="youtube" defaultValue={settings.social.youtube ?? ""} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Checkout</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Pedido mínimo (R$)</Label><Input name="minOrderValue" type="number" step="0.01" defaultValue={settings.checkout.minOrderValue} /></div>
          <div className="space-y-1.5"><Label>Frete grátis a partir de (R$)</Label><Input name="freeShippingThreshold" type="number" step="0.01" defaultValue={settings.checkout.freeShippingThreshold} /></div>
          <label className="flex items-center gap-3 sm:col-span-2">
            <input type="checkbox" name="guestCheckout" defaultChecked={settings.checkout.guestCheckout} className="h-4 w-4" />
            <span className="text-sm">Permitir checkout como convidado (sem cadastro)</span>
          </label>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isPending}>{isPending ? "Salvando..." : "Salvar configurações"}</Button>
    </form>
  );
}

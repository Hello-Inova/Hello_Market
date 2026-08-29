"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { updateNotificationPreferencesAction } from "@/actions/notification.actions";

interface Prefs {
  orderUpdates: boolean;
  promotions: boolean;
  newsletter: boolean;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  pushEnabled: boolean;
}

const OPTIONS: { key: keyof Prefs; label: string; description: string }[] = [
  { key: "orderUpdates", label: "Atualizações de pedidos", description: "Status de pagamento, envio e entrega" },
  { key: "promotions", label: "Promoções", description: "Ofertas e cupons exclusivos" },
  { key: "newsletter", label: "Newsletter", description: "Novidades e lançamentos" },
  { key: "emailEnabled", label: "Canal: E-mail", description: "" },
  { key: "whatsappEnabled", label: "Canal: WhatsApp", description: "" },
  { key: "pushEnabled", label: "Canal: Push", description: "" },
];

export function NotificationPreferencesForm({ prefs }: { prefs: Prefs }) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await updateNotificationPreferencesAction(formData);
          toast.success("Preferências salvas.");
        });
      }}
      className="space-y-4"
    >
      {OPTIONS.map((opt) => (
        <label key={opt.key} className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{opt.label}</p>
            {opt.description && <p className="text-xs text-muted-foreground">{opt.description}</p>}
          </div>
          <Switch name={opt.key} defaultChecked={prefs[opt.key]} />
        </label>
      ))}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar preferências"}
      </Button>
    </form>
  );
}

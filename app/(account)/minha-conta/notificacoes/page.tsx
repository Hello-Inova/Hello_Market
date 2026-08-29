import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationPreferencesForm } from "@/components/account/notification-preferences-form";
import { formatDateTime } from "@/lib/utils";
import { Bell } from "lucide-react";

export const metadata: Metadata = { title: "Notificações" };

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [prefs, notifications] = await Promise.all([
    prisma.notificationPreference.findUnique({ where: { userId: user.id } }),
    prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Notificações e preferências</h1>

      <Card>
        <CardHeader>
          <CardTitle>Preferências de notificação</CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationPreferencesForm
            prefs={{
              orderUpdates: prefs?.orderUpdates ?? true,
              promotions: prefs?.promotions ?? true,
              newsletter: prefs?.newsletter ?? false,
              emailEnabled: prefs?.emailEnabled ?? true,
              whatsappEnabled: prefs?.whatsappEnabled ?? false,
              pushEnabled: prefs?.pushEnabled ?? false,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de notificações</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma notificação por aqui ainda.</p>
          ) : (
            <ul className="divide-y">
              {notifications.map((n) => (
                <li key={n.id} className="flex gap-3 py-3">
                  <Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

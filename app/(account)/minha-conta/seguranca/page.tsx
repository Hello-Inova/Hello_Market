import type { Metadata } from "next";
import { getCurrentUser, listUserSessions } from "@/lib/auth/session";
import { SecurityPanel } from "@/components/account/security-panel";

export const metadata: Metadata = { title: "Segurança" };

export default async function SecurityPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const sessions = await listUserSessions(user.id);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Segurança da conta</h1>
      <SecurityPanel
        sessions={sessions.map((s) => ({
          id: s.id,
          userAgent: s.userAgent,
          ip: s.ip,
          lastActiveAt: s.lastActiveAt.toISOString(),
          isCurrent: s.isCurrent,
        }))}
      />
    </div>
  );
}

import { NextResponse } from "next/server";
import { destroyCurrentSession, getCurrentUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (user) await logAudit({ userId: user.id, action: "user.logout" });
  await destroyCurrentSession();
  return NextResponse.redirect(new URL("/", request.url));
}

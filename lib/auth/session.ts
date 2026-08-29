import "server-only";
import { cookies, headers } from "next/headers";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import type { User } from "@prisma/client";

const SESSION_COOKIE = "hm_session";
const SESSION_DURATION_DAYS = 30;

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function getRequestMeta() {
  const h = await headers();
  return {
    userAgent: h.get("user-agent") ?? undefined,
    ip:
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      undefined,
  };
}

export async function createUserSession(userId: string) {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const { userAgent, ip } = await getRequestMeta();
  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
  );

  await prisma.session.create({
    data: { userId, tokenHash, userAgent, ip, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) return null;
  if (session.user.blocked || session.user.deletedAt) return null;

  return session;
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getCurrentSession();
  return session?.user ?? null;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }
  return user;
}

export async function touchSession(sessionId: string) {
  await prisma.session
    .update({ where: { id: sessionId }, data: { lastActiveAt: new Date() } })
    .catch(() => null);
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const tokenHash = hashToken(token);
    await prisma.session.deleteMany({ where: { tokenHash } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function destroyAllSessions(userId: string, keepCurrent = false) {
  if (keepCurrent) {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    const currentHash = token ? hashToken(token) : null;
    await prisma.session.deleteMany({
      where: { userId, ...(currentHash ? { tokenHash: { not: currentHash } } : {}) },
    });
  } else {
    await prisma.session.deleteMany({ where: { userId } });
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
  }
}

export async function listUserSessions(userId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const currentHash = token ? hashToken(token) : null;

  const sessions = await prisma.session.findMany({
    where: { userId },
    orderBy: { lastActiveAt: "desc" },
  });

  return sessions.map((s) => ({ ...s, isCurrent: s.tokenHash === currentHash }));
}

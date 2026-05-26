import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "dash_admin_session";
const SESSION_TTL_DAYS = 14;

function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function getAdminSessionCookieName() {
  return COOKIE_NAME;
}

export async function createAdminSession(adminId: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = sha256Hex(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.adminSession.create({
    data: { adminId, tokenHash, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });

  return { expiresAt };
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = sha256Hex(token);
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash },
    include: { admin: { include: { school: true } } },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) return null;

  return session;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    const tokenHash = sha256Hex(token);
    await prisma.adminSession.deleteMany({ where: { tokenHash } });
  }

  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    path: "/",
  });
}


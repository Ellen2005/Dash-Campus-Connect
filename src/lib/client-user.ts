"use client";

import type { Session } from "@supabase/supabase-js";

export interface ClientDashUser {
  id: string;
  fullName: string;
  username: string;
  faculty: string;
  year: string;
  avatar?: string;
}

export async function ensureDbUser(dashUser: ClientDashUser, session?: Session | null) {
  const email = session?.user?.email;
  const res = await fetch("/api/users/sync", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      id: dashUser.id,
      email,
      fullName: dashUser.fullName,
      username: dashUser.username,
      faculty: dashUser.faculty,
      year: dashUser.year,
      avatar: dashUser.avatar,
    }),
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload?.error ?? "Failed to sync user.");
  }

  return res.json();
}

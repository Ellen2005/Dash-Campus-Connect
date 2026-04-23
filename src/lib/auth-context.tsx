"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { User, Session } from "@supabase/supabase-js";

// Singleton — one client for the entire app lifetime
let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          storageKey: "dash-auth-token",
        },
      }
    );
  }
  return _supabase;
}

export const supabase = getSupabase();

export function toSyntheticEmail(studentId: string, schoolId: string): string {
  const cleanId = studentId.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanSchool = schoolId.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${cleanId}.${cleanSchool}@dash-campus.app`;
}

interface DashUser {
  id: string;
  studentId: string;
  fullName: string;
  username: string;
  schoolId: string;
  schoolName: string;
  faculty: string;
  year: string;
  role: "student" | "student_admin" | "admin";
  status: "pending" | "active" | "suspended";
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  dashUser: DashUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (studentId: string, schoolId: string, password: string) => Promise<{ error: string | null }>;
  signUp: (data: {
    studentId: string;
    schoolId: string;
    password: string;
    fullName: string;
    username: string;
    faculty: string;
    year: string;
  }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  supabase: SupabaseClient;
}

const AuthContext = createContext<AuthContextType>({
  user: null, dashUser: null, session: null, loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  supabase,
});

function buildDashUser(u: User): DashUser {
  const meta = u.user_metadata ?? {};
  return {
    id: u.id,
    studentId: meta.student_id ?? "",
    fullName: meta.full_name ?? "Student",
    username: meta.username ?? "user",
    schoolId: meta.school_id ?? "",
    schoolName: meta.school_name ?? "",
    faculty: meta.faculty ?? "",
    year: meta.year ?? "",
    role: meta.role ?? "student",
    status: meta.status ?? "pending",
    avatar: meta.avatar_url,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dashUser, setDashUser] = useState<DashUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const client = getSupabase();

    // Get initial session once
    client.auth.getSession().then(({ data }) => {
      const s = data.session;
      setSession(s);
      const u = s?.user ?? null;
      setUser(u);
      if (u) setDashUser(buildDashUser(u));
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      const u = s?.user ?? null;
      setUser(u);
      setDashUser(u ? buildDashUser(u) : null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (studentId: string, schoolId: string, password: string) => {
    const email = toSyntheticEmail(studentId, schoolId);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (data: {
    studentId: string; schoolId: string; password: string;
    fullName: string; username: string; faculty: string; year: string;
  }) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          studentId: data.studentId.trim().toUpperCase(),
          schoolId: data.schoolId,
          password: data.password,
          fullName: data.fullName,
          username: data.username.trim().toLowerCase().replace(/\s/g, "_"),
          faculty: data.faculty,
          year: data.year,
        }),
      });
      const json = await res.json().catch(() => ({} as Record<string, string>));
      if (!res.ok) return { error: json?.error ?? "Registration failed. Please try again." };
      return { error: null };
    } catch {
      return { error: "Network error. Please check your connection and try again." };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setDashUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, dashUser, session, loading, signIn, signUp, signOut, supabase }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

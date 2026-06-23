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
  fieldOfStudyId?: string;
  levelId?: string;
  role: "student" | "student_admin" | "admin";
  status: "pending" | "active" | "suspended";
  isStudentAdmin: boolean;
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
    faculty?: string;
    year?: string;
    fieldOfStudyId?: string;
    levelId?: string;
  }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshUserMetadata: () => Promise<void>;
  supabase: SupabaseClient;
}

const AuthContext = createContext<AuthContextType>({
  user: null, dashUser: null, session: null, loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  refreshUserMetadata: async () => {},
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
    fieldOfStudyId: meta.field_of_study_id,
    levelId: meta.level_id,
    role: meta.role ?? "student",
    status: meta.status ?? "pending",
    isStudentAdmin: meta.is_student_admin ?? false,
    avatar: meta.avatar_url,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dashUser, setDashUser] = useState<DashUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);
  const refreshInFlight = useRef(false);
  const lastMetadataRefreshAt = useRef(0);

  const syncFromUser = (nextUser: User | null) => {
    setUser(nextUser);
    setDashUser(nextUser ? buildDashUser(nextUser) : null);
  };

  const refreshUserMetadata = async () => {
    if (refreshInFlight.current) return;
    const now = Date.now();
    if (now - lastMetadataRefreshAt.current < 60_000) return;

    refreshInFlight.current = true;
    try {
      const client = getSupabase();
      const { data: sessionData } = await client.auth.getSession();
      const currentSession = sessionData.session;

      if (!currentSession) {
        setSession(null);
        syncFromUser(null);
        return;
      }

      const { data: userData, error: userError } = await client.auth.getUser();
      if (!userError) {
        syncFromUser(userData.user ?? currentSession.user ?? null);
        lastMetadataRefreshAt.current = now;
        return;
      }

      syncFromUser(currentSession.user ?? null);
      lastMetadataRefreshAt.current = now;
    } finally {
      refreshInFlight.current = false;
    }
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const client = getSupabase();

    // Get initial session once
    client.auth.getSession().then(({ data }) => {
      const s = data.session;
      setSession(s);
      syncFromUser(s?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      syncFromUser(s?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;

    const refresh = () => {
      void refreshUserMetadata();
    };

    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [session]);

  useEffect(() => {
    if (!session) return;
    void refreshUserMetadata();
  }, [session?.user?.id]);

  const signIn = async (studentId: string, schoolId: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ studentId, schoolId, password }),
      });
      const json = await res.json().catch(() => ({} as { error?: string; session?: Session }));
      if (!res.ok) {
        return { error: json?.error ?? "Login failed." };
      }
      if (json.session) {
        const { error: sessionError } = await supabase.auth.setSession(json.session);
        if (sessionError) return { error: sessionError.message };
      } else {
        const email = toSyntheticEmail(studentId, schoolId);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: error.message };
      }
      const { data: userData } = await supabase.auth.getUser();
      const status = userData.user?.user_metadata?.status;
      if (status === "pending" || status === "rejected" || status === "suspended") {
        await supabase.auth.signOut();
        if (status === "suspended") {
          return { error: "Your account has been suspended. Contact your school admin." };
        }
        if (status === "rejected") {
          return { error: "Your registration was not approved." };
        }
        return { error: "Your account is pending admin approval." };
      }
      return { error: null };
    } catch {
      return { error: "Network error. Please try again." };
    }
  };

  const signUp = async (data: {
    studentId: string; schoolId: string; password: string;
    fullName: string; username: string; faculty?: string; year?: string;
    fieldOfStudyId?: string; levelId?: string;
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
          fieldOfStudyId: data.fieldOfStudyId,
          levelId: data.levelId,
        }),
      });
      const contentType = res.headers.get("content-type") ?? "";
      let json: Record<string, string> = {};
      let text = "";

      if (contentType.includes("application/json")) {
        json = await res.json().catch(() => ({} as Record<string, string>));
      } else {
        text = await res.text().catch(() => "");
      }

      if (!res.ok) {
        return {
          error:
            json?.error ??
            (text ? "Server returned a non-JSON error response. Please retry." : "Registration failed. Please try again."),
        };
      }
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
    <AuthContext.Provider value={{ user, dashUser, session, loading, signIn, signUp, signOut, refreshUserMetadata, supabase }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

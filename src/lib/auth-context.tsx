"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@supabase/supabase-js";
import type { User, Session } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Converts a Student ID + School ID into a synthetic internal email.
 * Students never see this — it's only used internally with Supabase Auth.
 * Format: studentid@schoolid.dash.internal
 * Example: 2024CS001@ubuea.dash.internal
 */
export function toSyntheticEmail(studentId: string, schoolId: string): string {
  const cleanId = studentId.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanSchool = schoolId.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${cleanId}@${cleanSchool}.dash.internal`;
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
  supabase: typeof supabase;
}

const AuthContext = createContext<AuthContextType>({
  user: null, dashUser: null, session: null, loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  supabase,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dashUser, setDashUser] = useState<DashUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  function buildDashUser(supabaseUser: User): DashUser {
    const meta = supabaseUser.user_metadata ?? {};
    return {
      id: supabaseUser.id,
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      const u = data.session?.user ?? null;
      setUser(u);
      if (u) setDashUser(buildDashUser(u));
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      const u = session?.user ?? null;
      setUser(u);
      if (u) setDashUser(buildDashUser(u));
      else setDashUser(null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (studentId: string, schoolId: string, password: string) => {
    const email = toSyntheticEmail(studentId, schoolId);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signUp = async (data: {
    studentId: string; schoolId: string; password: string;
    fullName: string; username: string; faculty: string; year: string;
  }) => {
    const email = toSyntheticEmail(data.studentId, data.schoolId);

    const { error } = await supabase.auth.signUp({
      email,
      password: data.password,
      options: {
        emailRedirectTo: undefined,
        data: {
          student_id: data.studentId.trim().toUpperCase(),
          full_name: data.fullName,
          username: data.username,
          school_id: data.schoolId,
          faculty: data.faculty,
          year: data.year,
          role: "student",
          status: "pending",
        },
      },
    });

    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setDashUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, dashUser, session, loading, signIn, signUp, signOut, supabase }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export { supabase };

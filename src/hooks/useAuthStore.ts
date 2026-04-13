import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// ── App-level User type (same shape as before) ────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: number;
  avatar: string;
}

export type AuthError =
  | "EMAIL_EXISTS"
  | "INVALID_CREDENTIALS"
  | "EMAIL_REQUIRED"
  | "PASSWORD_TOO_SHORT"
  | "NAME_REQUIRED"
  | "UNKNOWN";

// ── Helpers ───────────────────────────────────────────────────
function getAvatarColor(name: string): string {
  const colors = [
    "#7c6ef7", "#34d399", "#f472b6", "#fbbf24",
    "#60a5fa", "#f87171", "#2dd4bf", "#a78bfa",
  ];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return colors[h % colors.length];
}

function mapUser(u: SupabaseUser): User {
  const name: string = u.user_metadata?.name ?? u.email?.split("@")[0] ?? "User";
  return {
    id: u.id,
    name,
    email: u.email ?? "",
    createdAt: new Date(u.created_at).getTime(),
    avatar: getAvatarColor(name),
  };
}

// ── Hook ──────────────────────────────────────────────────────
export function useAuthStore() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // true while Supabase is restoring the session on first load
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Restore session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ? mapUser(session.user) : null);
      setAuthLoading(false);
    });

    // Keep in sync with Supabase auth events (login, logout, token refresh …)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ? mapUser(session.user) : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── register ──────────────────────────────────────────────
  const register = useCallback(
    async (name: string, email: string, password: string): Promise<AuthError | null> => {
      const trimmedName  = name.trim();
      const trimmedEmail = email.trim().toLowerCase();

      if (!trimmedName)       return "NAME_REQUIRED";
      if (!trimmedEmail)      return "EMAIL_REQUIRED";
      if (password.length < 6) return "PASSWORD_TOO_SHORT";

      const { error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: { data: { name: trimmedName } },
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("already registered") || msg.includes("already exists")) {
          return "EMAIL_EXISTS";
        }
        console.error("Supabase signUp error:", error.message);
        return "UNKNOWN";
      }
      return null;
    },
    []
  );

  // ── login ─────────────────────────────────────────────────
  const login = useCallback(
    async (email: string, password: string): Promise<AuthError | null> => {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) return "INVALID_CREDENTIALS";
      return null;
    },
    []
  );

  // ── logout ────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { currentUser, authLoading, register, login, logout };
}

import { useState, useCallback } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: number;
  avatar: string;
}

interface AuthState {
  currentUserId: string | null;
  users: Record<string, { passwordHash: string; user: User }>;
}

const AUTH_KEY = "splitr_auth_v1";

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

function loadAuth(): AuthState {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || '{"currentUserId":null,"users":{}}');
  } catch {
    return { currentUserId: null, users: {} };
  }
}

function saveAuth(state: AuthState) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(state));
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function getAvatarColor(name: string): string {
  const colors = ["#7c6ef7", "#34d399", "#f472b6", "#fbbf24", "#60a5fa", "#f87171", "#2dd4bf", "#a78bfa"];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return colors[h % colors.length];
}

export type AuthError = "EMAIL_EXISTS" | "INVALID_CREDENTIALS" | "EMAIL_REQUIRED" | "PASSWORD_TOO_SHORT" | "NAME_REQUIRED";

export function useAuthStore() {
  const [auth, setAuth] = useState<AuthState>(loadAuth);

  const currentUser = auth.currentUserId ? auth.users[auth.currentUserId]?.user ?? null : null;

  const register = useCallback(
    (name: string, email: string, password: string): AuthError | null => {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedName = name.trim();
      if (!trimmedName) return "NAME_REQUIRED";
      if (!trimmedEmail) return "EMAIL_REQUIRED";
      if (password.length < 6) return "PASSWORD_TOO_SHORT";

      const existing = Object.values(auth.users).find(
        (u) => u.user.email.toLowerCase() === trimmedEmail
      );
      if (existing) return "EMAIL_EXISTS";

      const id = uid();
      const user: User = {
        id,
        name: trimmedName,
        email: trimmedEmail,
        createdAt: Date.now(),
        avatar: getAvatarColor(trimmedName),
      };
      const newAuth: AuthState = {
        currentUserId: id,
        users: {
          ...auth.users,
          [id]: { passwordHash: simpleHash(password + trimmedEmail), user },
        },
      };
      saveAuth(newAuth);
      setAuth(newAuth);
      return null;
    },
    [auth]
  );

  const login = useCallback(
    (email: string, password: string): AuthError | null => {
      const trimmedEmail = email.trim().toLowerCase();
      const entry = Object.values(auth.users).find(
        (u) => u.user.email.toLowerCase() === trimmedEmail
      );
      if (!entry || entry.passwordHash !== simpleHash(password + trimmedEmail)) {
        return "INVALID_CREDENTIALS";
      }
      const newAuth: AuthState = { ...auth, currentUserId: entry.user.id };
      saveAuth(newAuth);
      setAuth(newAuth);
      return null;
    },
    [auth]
  );

  const logout = useCallback(() => {
    const newAuth: AuthState = { ...auth, currentUserId: null };
    saveAuth(newAuth);
    setAuth(newAuth);
  }, [auth]);

  return { currentUser, register, login, logout };
}

import { createContext, useContext, ReactNode } from "react";
import { useAuthStore, User, AuthError } from "@/hooks/useAuthStore";

interface AuthContextType {
  currentUser: User | null;
  register: (name: string, email: string, password: string) => AuthError | null;
  login: (email: string, password: string) => AuthError | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthStore();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

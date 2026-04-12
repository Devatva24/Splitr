import { createContext, useContext, ReactNode } from "react";
import { useExpenseStore } from "@/hooks/useExpenseStore";
import { useAuth } from "./AuthContext";

type StoreType = ReturnType<typeof useExpenseStore>;
const StoreContext = createContext<StoreType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const store = useExpenseStore(currentUser?.id ?? "");
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreType {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { type Role, userSession } from "@/lib/mock-data";

interface AppState {
  role: Role;
  setRole: (role: Role) => void;
  userName: string;
  userEmail: string;
}

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(userSession.role);
  const value = useMemo(
    () => ({
      role,
      setRole,
      userName: userSession.userName,
      userEmail: userSession.userEmail
    }),
    [role]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error("useAppState must be used inside AppStateProvider");
  }

  return context;
}

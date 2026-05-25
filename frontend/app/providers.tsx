"use client";

import { AppStateProvider } from "@/components/app/app-state";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <AppStateProvider>{children}</AppStateProvider>;
}

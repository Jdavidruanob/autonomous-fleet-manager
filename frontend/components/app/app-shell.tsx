import type { ReactNode } from "react";
import { AppStateProvider } from "@/components/app/app-state";
import { Dock } from "@/components/app/dock";
import { Header } from "@/components/app/header";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AppStateProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-[1400px] px-4 pb-24 pt-6">{children}</main>
        <Dock />
      </div>
    </AppStateProvider>
  );
}

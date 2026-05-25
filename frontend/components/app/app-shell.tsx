import type { ReactNode } from "react";
import { Header } from "./header";
import { Dock } from "./dock";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-[1400px] px-4 pb-24 pt-6">{children}</main>
      <Dock />
    </div>
  );
}
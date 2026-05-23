import type { Metadata } from "next";
import { AppShell } from "@/components/app/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fleet Control PUJ",
  description: "Internal fleet operations dashboard for Pontificia Universidad Javeriana Cali"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

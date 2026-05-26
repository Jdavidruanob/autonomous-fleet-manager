"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/auth";
import { LogIn, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const domainOk = email.toLowerCase().endsWith("@javerianacali.edu.co");
  const emailError = touched && email.length > 0 && !domainOk;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);

    if (!domainOk) return;
    if (!pwd) {
      setError("La contraseña es requerida");
      return;
    }

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), pwd);
      router.replace("/");
    } catch (err: any) {
      setError(err?.message ?? "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(role: "admin" | "operator") {
    setEmail(
      role === "admin"
        ? "admin@javerianacali.edu.co"
        : "operador@javerianacali.edu.co"
    );
    setPwd(role === "admin" ? "Admin1234" : "Operador1234");
    setTouched(false);
    setError(null);
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <aside className="hidden lg:flex relative overflow-hidden bg-primary text-primary-foreground p-12 flex-col justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary-foreground text-primary font-bold text-sm">
            FC
          </div>
          <span className="font-semibold tracking-tight">Fleet Control PUJ</span>
        </div>
        <div className="space-y-4 max-w-md">
          <div className="inline-block rounded-full border border-primary-foreground/30 px-3 py-1 text-xs text-primary-foreground/70">
            Sistema interno · Pontificia Universidad Javeriana Cali
          </div>
          <h1 className="text-3xl font-semibold leading-tight">
            Gestión de flota de robots y drones autónomos del campus.
          </h1>
          <p className="text-primary-foreground/70 text-sm leading-relaxed">
            Monitoreo en tiempo real, órdenes de servicio y telemetría
            centralizada para el equipo operativo.
          </p>
        </div>
        <div className="flex items-center gap-6 text-xs text-primary-foreground/60">
          <div>
            <span className="text-primary-foreground font-semibold">6</span>{" "}
            dispositivos activos
          </div>
          <div>
            <span className="text-primary-foreground font-semibold">8</span>{" "}
            puntos de encuentro
          </div>
          <div>
            <span className="text-primary-foreground font-semibold">24/7</span>{" "}
            operación
          </div>
        </div>
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary-foreground/20 blur-3xl" />
      </aside>

      <section className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Iniciar sesión</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Acceso con tu cuenta institucional.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="email">
                Correo institucional
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                className={cn(
                  emailError && "border-destructive focus-visible:ring-destructive"
                )}
                placeholder="usuario@javerianacali.edu.co"
              />
              {emailError ? (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  Debe ser un correo @javerianacali.edu.co
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Solo dominios @javerianacali.edu.co
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="pwd">
                Contraseña
              </label>
              <Input
                id="pwd"
                type="password"
                autoComplete="current-password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>

            <div className="rounded-lg border border-dashed bg-secondary/40 p-3 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Acceso rápido demo
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => fillDemo("admin")}
                  disabled={loading}
                >
                  Admin demo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => fillDemo("operator")}
                  disabled={loading}
                >
                  Operador demo
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground text-center">
                Rellena las credenciales y luego presiona "Iniciar sesión"
              </p>
            </div>
          </form>
        </Card>
      </section>
    </div>
  );
}

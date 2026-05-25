"use client";

import { useRouter } from "next/navigation";
import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DevicesPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-secondary text-muted-foreground">
        <Construction className="h-8 w-8" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Vista de dispositivos</h1>
        <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
          Esta pantalla no está implementada en la demo. Puedes monitorear cada dispositivo individualmente desde el panel principal.
        </p>
      </div>
      <Button variant="outline" onClick={() => router.push("/")}>
        Ir al panel principal
      </Button>
    </div>
  );
}

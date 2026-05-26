"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppState } from "@/components/app/app-state";
import { navItems } from "@/components/app/nav-items";
import { cn } from "@/lib/utils";

export function Dock() {
  const pathname = usePathname();
  const { user } = useAppState();
  const visibleItems = navItems.filter((item) => !item.adminOnly || user?.role === "administrator");
  const activeHref =
    visibleItems
      .filter((item) => item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`))
      .sort((left, right) => right.href.length - left.href.length)[0]?.href ?? null;

  return (
    <nav aria-label="Navegacion principal" className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center">
      <div className="pointer-events-auto flex items-end gap-1 rounded-2xl border bg-card/95 px-2 py-1.5 shadow-lg shadow-black/5 backdrop-blur">
        {visibleItems.map(({ href, label, Icon, emphasize }) => {
            const active = activeHref === href;

            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                title={label}
                className={cn(
                  "group relative grid h-11 w-11 place-items-center rounded-xl transition-all",
                  active
                    ? "scale-105 bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:scale-110 hover:bg-secondary hover:text-foreground",
                  emphasize && !active && "text-primary"
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {active && <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-primary-foreground" />}
              </Link>
            );
          })}
      </div>
    </nav>
  );
}

import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export function SelectTrigger({ className, children, ...props }: any) {
  return (
    <div className={cn("flex h-9 w-full rounded-md border border-input bg-transparent shadow-sm", className)} {...props}>
      {children}
    </div>
  );
}

export function SelectContent({ className, children, ...props }: any) {
  return (
    <div className={cn("relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md", className)} {...props}>
      {children}
    </div>
  );
}

export function SelectItem({ className, children, ...props }: any) {
  return (
    <div
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent focus:bg-accent",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SelectValue({ ...props }: any) {
  return <span {...props} />;
}
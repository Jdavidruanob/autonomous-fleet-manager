import { pageTitles } from "@/lib/mock-data";

export function PagePlaceholder({ path }: { path: keyof typeof pageTitles }) {
  return (
    <section className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Fleet Control PUJ</p>
      <h1 className="text-2xl font-semibold tracking-tight">{pageTitles[path]}</h1>
    </section>
  );
}

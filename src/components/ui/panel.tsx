import type { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
};

export function Panel({ children }: PanelProps) {
  return (
    <section className="rounded-md border border-border bg-surface p-5 shadow-panel">
      {children}
    </section>
  );
}

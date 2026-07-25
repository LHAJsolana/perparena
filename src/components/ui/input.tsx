import type { InputHTMLAttributes } from "react";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`min-h-10 w-full rounded-sm border border-border bg-background-elevated px-3 py-2 font-mono text-sm text-foreground placeholder:text-subtle disabled:cursor-not-allowed disabled:opacity-60 ${props.className ?? ""}`}
    />
  );
}

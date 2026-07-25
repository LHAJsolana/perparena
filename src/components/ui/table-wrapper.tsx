import type { ReactNode } from "react";

type TableWrapperProps = {
  children: ReactNode;
  label: string;
};

export function TableWrapper({ children, label }: TableWrapperProps) {
  return (
    <div
      aria-label={label}
      className="overflow-x-auto rounded-md border border-border bg-surface"
      role="region"
      tabIndex={0}
    >
      <table className="min-w-full border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  );
}

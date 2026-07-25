"use client";

import type { ReactNode } from "react";
import { useState } from "react";

type TabItem = {
  id: string;
  label: string;
  content: ReactNode;
};

type TabsProps = {
  items: TabItem[];
  label: string;
};

export function Tabs({ items, label }: TabsProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const activeItem = items.find((item) => item.id === activeId) ?? items[0];

  if (!activeItem) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div aria-label={label} className="flex flex-wrap gap-2" role="tablist">
        {items.map((item) => (
          <button
            key={item.id}
            aria-selected={item.id === activeItem.id}
            className={`rounded-sm border px-3 py-2 text-sm font-medium ${
              item.id === activeItem.id
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-border bg-surface text-muted"
            }`}
            onClick={() => setActiveId(item.id)}
            role="tab"
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      <div
        className="rounded-md border border-border bg-surface p-4"
        role="tabpanel"
      >
        {activeItem.content}
      </div>
    </div>
  );
}

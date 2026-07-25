"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { appConfig, appNavigation } from "@/lib/config/app-config";

function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-[var(--space-container)] py-3">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3"
          onClick={() => setIsOpen(false)}
        >
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-sm border border-accent/40 bg-accent/10 font-mono text-sm font-black text-accent shadow-glow"
          >
            PA
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold uppercase tracking-wide text-foreground">
              {appConfig.productName}
            </span>
            <span className="hidden truncate font-mono text-[11px] uppercase text-subtle sm:block">
              Simulated risk arena
            </span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Primary navigation"
        >
          {appNavigation.map((item) => {
            const active = isActiveRoute(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-sm px-3 py-2 text-sm font-medium transition hover:bg-surface-raised hover:text-foreground ${
                  active
                    ? "bg-accent/10 text-accent ring-1 ring-accent/25"
                    : "text-muted"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden rounded-sm border border-info/30 bg-info/10 px-2 py-1 font-mono text-[11px] uppercase text-info sm:inline-flex">
            Prototype
          </span>
          <Button
            type="button"
            variant="secondary"
            className="md:hidden"
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsOpen((current) => !current)}
          >
            Menu
          </Button>
        </div>
      </div>

      {isOpen ? (
        <nav
          id="mobile-navigation"
          className="border-t border-border bg-background-elevated px-[var(--space-container)] py-3 md:hidden"
          aria-label="Mobile navigation"
        >
          <div className="grid gap-2">
            {appNavigation.map((item) => {
              const active = isActiveRoute(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setIsOpen(false)}
                  className={`rounded-sm border px-3 py-3 text-sm font-medium ${
                    active
                      ? "border-accent/35 bg-accent/10 text-accent"
                      : "border-border bg-surface text-muted"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </header>
  );
}

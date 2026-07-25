import type { ReactNode } from "react";

type MainContainerProps = {
  children: ReactNode;
};

export function MainContainer({ children }: MainContainerProps) {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-[var(--space-container)] py-8 sm:py-10">
      {children}
    </main>
  );
}

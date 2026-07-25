import { appConfig } from "@/lib/config/app-config";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-background-elevated">
      <div className="mx-auto grid w-full max-w-7xl gap-4 px-[var(--space-container)] py-6 text-sm text-muted md:grid-cols-[1fr_auto]">
        <p className="max-w-4xl leading-6">{appConfig.globalDisclaimer}</p>
        <p className="font-mono text-xs uppercase text-subtle">
          Repository: {appConfig.repositoryUrl} / Social: {appConfig.socialUrl}
        </p>
      </div>
    </footer>
  );
}

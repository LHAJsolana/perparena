type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <section className="space-y-3 border-b border-border pb-6">
      <p className="font-mono text-xs font-semibold uppercase tracking-wide text-accent">
        {eyebrow}
      </p>
      <h1 className="max-w-4xl text-3xl font-semibold text-foreground sm:text-4xl">
        {title}
      </h1>
      <p className="max-w-3xl text-base leading-7 text-muted">{description}</p>
    </section>
  );
}

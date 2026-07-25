type SectionHeadingProps = {
  title: string;
  description?: string;
};

export function SectionHeading({ title, description }: SectionHeadingProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      {description ? (
        <p className="max-w-3xl text-sm leading-6 text-muted">{description}</p>
      ) : null}
    </div>
  );
}

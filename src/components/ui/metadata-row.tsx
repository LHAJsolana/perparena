type MetadataRowProps = {
  label: string;
  value: string;
};

export function MetadataRow({ label, value }: MetadataRowProps) {
  return (
    <div className="grid gap-1 border-b border-border/70 py-2 text-sm last:border-b-0 sm:grid-cols-[12rem_1fr]">
      <dt className="font-mono text-xs uppercase text-subtle">{label}</dt>
      <dd className="min-w-0 break-words font-mono text-muted">{value}</dd>
    </div>
  );
}

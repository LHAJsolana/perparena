type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-sm bg-surface-raised motion-safe:animate-pulse ${className ?? "h-4 w-full"}`}
    />
  );
}

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <EmptyState
      title="Page not found"
      description="This PerpArena placeholder route is not available."
      action={<Button href="/">Return home</Button>}
    />
  );
}

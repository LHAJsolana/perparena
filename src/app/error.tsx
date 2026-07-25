"use client";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="space-y-4">
      <ErrorMessage
        title="Something went wrong"
        message={error.message || "The application shell could not render."}
      />
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}

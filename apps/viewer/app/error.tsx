"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Viewer error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl">
      <Alert variant="destructive">
        <AlertTriangle />
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>
          <p className="mb-2">{error.message || "An unexpected error occurred."}</p>
          {error.digest ? (
            <p className="font-mono text-xs opacity-75">digest: {error.digest}</p>
          ) : null}
        </AlertDescription>
      </Alert>
      <div className="mt-4">
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}

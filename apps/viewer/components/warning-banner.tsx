import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface WarningBannerProps {
  title: string;
  message: string;
  filePath?: string;
}

export function WarningBanner({ title, message, filePath }: WarningBannerProps) {
  return (
    <Alert variant="destructive">
      <AlertTriangle />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{message}</p>
        {filePath ? <p className="mt-1 font-mono text-xs opacity-75">{filePath}</p> : null}
      </AlertDescription>
    </Alert>
  );
}

import type { FallbackProps } from "react-error-boundary";
import { AppErrorView } from "@/theme/components/AppErrorView/AppErrorView";

export function ErrorPage({ error, resetErrorBoundary }: FallbackProps) {
  return <AppErrorView actionLabel="Try again" error={error} onAction={resetErrorBoundary} />;
}

import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { AppErrorView } from "@/theme/components/AppErrorView/AppErrorView";

interface QueryErrorBoundaryProps {
  children: React.ReactNode;
}

export function QueryErrorBoundary({ children }: QueryErrorBoundaryProps) {
  const { reset } = useQueryErrorResetBoundary();

  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <AppErrorView actionLabel="Retry" error={error} onAction={resetErrorBoundary} />
      )}
      onReset={reset}
    >
      {children}
    </ErrorBoundary>
  );
}

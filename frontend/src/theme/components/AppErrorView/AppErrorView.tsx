import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router";
import { ApplicationError, NotFoundError } from "@/lib/errors";
import "./AppErrorView.css";

interface AppErrorViewProps {
  actionLabel?: string;
  error?: unknown;
  onAction?: () => void;
  title?: string;
}

export function AppErrorView({ actionLabel, error, onAction, title }: AppErrorViewProps) {
  const resolvedTitle = title ?? getTitle(error);
  const details = getErrorDetails(error);

  return (
    <div className="appErrorView">
      <div className="panel">
        <span className="eyebrow">Upright</span>
        <Stack gap="sm">
          <Title order={1}>{resolvedTitle}</Title>
          <Text c="dimmed">{getMessage(error)}</Text>
        </Stack>

        <Group className="actions">
          {onAction ? <Button onClick={onAction}>{actionLabel ?? "Try again"}</Button> : null}
          <Button component={Link} to="/home" variant="light">
            Go home
          </Button>
          <Button component={Link} to="/login" variant="default">
            Back to login
          </Button>
        </Group>

        {details ? (
          <details className="details">
            <summary className="detailsSummary">Technical details</summary>
            <pre className="detailsContent">{details}</pre>
          </details>
        ) : null}
      </div>
    </div>
  );
}

function getMessage(error: unknown) {
  if (error instanceof NotFoundError) {
    return "The page or resource you requested could not be found.";
  }

  if (error instanceof ApplicationError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error interrupted the app.";
}

function getTitle(error: unknown) {
  if (error instanceof NotFoundError) {
    return "Page not found";
  }

  return "Something went wrong";
}

function getErrorDetails(error: unknown) {
  if (error instanceof ApplicationError && error.details) {
    return JSON.stringify(error.details, null, 2);
  }

  if (error instanceof Error && error.stack) {
    return error.stack;
  }

  return null;
}

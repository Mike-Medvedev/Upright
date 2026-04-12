import { isRouteErrorResponse, useRouteError } from "react-router";
import { NotFoundError } from "@/lib/errors";
import { AppErrorView } from "@/theme/components/AppErrorView/AppErrorView";

export function RouteErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <AppErrorView error={new NotFoundError("Page not found")} />;
  }

  return <AppErrorView error={error} />;
}

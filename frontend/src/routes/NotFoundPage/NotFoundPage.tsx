import { NotFoundError } from "@/lib/errors";
import { AppErrorView } from "@/theme/components/AppErrorView/AppErrorView";

export function NotFoundPage() {
  return <AppErrorView error={new NotFoundError("Page not found")} />;
}

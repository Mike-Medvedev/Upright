import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/infra/auth/auth.context";
import { AppLoadingView } from "@/theme/components/AppLoadingView/AppLoadingView";

export function PublicOnlyRoute() {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <AppLoadingView
        description="We are restoring your session before loading the auth screens."
        title="Preparing authentication"
      />
    );
  }

  if (status === "authenticated") {
    return <Navigate replace to="/home" />;
  }

  return <Outlet />;
}

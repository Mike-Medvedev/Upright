import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/infra/auth/auth.context";
import { AppLoadingView } from "@/theme/components/AppLoadingView/AppLoadingView";

export function ProtectedRoute() {
  const location = useLocation();
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <AppLoadingView
        description="We are restoring your session before loading the app."
        title="Checking your account"
      />
    );
  }

  if (status !== "authenticated") {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return <Outlet />;
}

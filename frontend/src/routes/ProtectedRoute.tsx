import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/infra/auth/auth.context";

export function ProtectedRoute() {
  const location = useLocation();
  const { status } = useAuth();

  if (status === "loading") return null; //dont render anything otherwise the page will flicker on refresh

  if (status !== "authenticated") {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return <Outlet />;
}

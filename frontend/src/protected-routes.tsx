import { Navigate } from "react-router";
import { useAuth } from "@/infra/auth/auth.context";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

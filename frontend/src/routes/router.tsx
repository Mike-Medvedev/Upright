import { createBrowserRouter, Navigate } from "react-router";
import { AuthCallbackPage } from "@/features/auth/page/AuthCallbackPage/AuthCallbackPage";
import { LoginPage } from "@/features/auth/page/LoginPage/LoginPage";
import { SignupPage } from "@/features/auth/page/SignupPage/SignupPage";
import { MonitoringPage } from "@/features/monitoring/page/MonitoringPage/MonitoringPage";
import { SettingsPage } from "@/features/settings/page/SettingsPage/SettingsPage";
import { NotFoundPage } from "@/routes/NotFoundPage/NotFoundPage";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { PublicOnlyRoute } from "@/routes/PublicOnlyRoute";
import { RouteErrorBoundary } from "@/routes/RouteErrorBoundary";
import { AppLayout } from "@/theme/components/AppLayout/AppLayout";

export const router = createBrowserRouter([
  {
    children: [
      {
        element: <PublicOnlyRoute />,
        children: [
          {
            element: <Navigate replace to="/login" />,
            path: "/",
          },
          {
            element: <LoginPage />,
            path: "/login",
          },
          {
            element: <SignupPage />,
            path: "/signup",
          },
        ],
      },
      {
        element: <AuthCallbackPage />,
        path: "/auth/callback",
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              {
                element: <MonitoringPage />,
                path: "/monitoring",
              },
              {
                element: <SettingsPage />,
                path: "/settings",
              },
              {
                element: <Navigate replace to="/monitoring" />,
                path: "/home",
              },
            ],
          },
        ],
      },
      {
        element: <NotFoundPage />,
        path: "*",
      },
    ],
    errorElement: <RouteErrorBoundary />,
  },
]);

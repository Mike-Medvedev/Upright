import { createBrowserRouter, Navigate } from "react-router";
import { AuthCallbackPage } from "@/features/auth/page/AuthCallbackPage/AuthCallbackPage";
import { LoginPage } from "@/features/auth/page/LoginPage/LoginPage";
import { SignupPage } from "@/features/auth/page/SignupPage/SignupPage";
import { HomePage } from "@/features/dashboard/page/HomePage/HomePage";
import { NotFoundPage } from "@/routes/NotFoundPage/NotFoundPage";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { PublicOnlyRoute } from "@/routes/PublicOnlyRoute";
import { RouteErrorBoundary } from "@/routes/RouteErrorBoundary";

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
            element: <HomePage />,
            path: "/home",
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

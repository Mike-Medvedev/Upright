import { createBrowserRouter, Outlet } from "react-router";
import ProtectedRoute from "@/protected-routes";
import LoginScreen from "./features/Login/screens/LoginScreen";

export const router = createBrowserRouter([
  { path: "/", element: <LoginScreen /> },
  {
    element: (
      <ProtectedRoute>
        <Outlet />
      </ProtectedRoute>
    ),
    children: [{ path: "/home", element: <div>Home</div> }],
  },
]);

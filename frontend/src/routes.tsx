import { createBrowserRouter, Outlet } from "react-router";
import App from "@/App";
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

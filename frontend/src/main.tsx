import "./index.css";
import "@mantine/core/styles.css";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import theme from "@/theme.ts";
import { RouterProvider } from "react-router/dom";
import { router } from "@/routes";
import { AuthProvider } from "@/infra/auth/auth.provider";

createRoot(document.getElementById("root")!).render(
  <MantineProvider theme={theme}>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </MantineProvider>,
);

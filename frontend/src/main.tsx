import "./index.css";
import "@mantine/core/styles.css";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { initializeApiClient } from "@/infra/api.client";
import { RouterProvider } from "react-router/dom";
import { AuthProvider } from "@/infra/auth/auth.provider";
import { queryClient } from "@/infra/tanstack.client";
import { ErrorPage } from "@/routes/ErrorPage/ErrorPage";
import { router } from "@/routes/router";
import theme from "@/theme/theme";
import { QueryErrorBoundary } from "@/theme/components/QueryErrorBoundary/QueryErrorBoundary";

initializeApiClient();

createRoot(document.getElementById("root")!).render(
  <MantineProvider defaultColorScheme="dark" forceColorScheme="dark" theme={theme}>
    <ErrorBoundary FallbackComponent={ErrorPage}>
      <QueryClientProvider client={queryClient}>
        <QueryErrorBoundary>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </QueryErrorBoundary>
      </QueryClientProvider>
    </ErrorBoundary>
  </MantineProvider>,
);

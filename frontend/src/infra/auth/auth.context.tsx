import { createContext, useContext } from "react";
import { ConfigurationError } from "@/lib/errors";
import type { AuthContextValue } from "@/features/auth/auth.types";

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new ConfigurationError("Auth context must be used within AuthProvider.");
  }

  return context;
}

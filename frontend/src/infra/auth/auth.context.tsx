import { createContext, useContext } from "react";
import { supabase } from "@/infra/auth/auth.client";

interface AuthContext {
  login: () => void;
  logout: () => void;
}

type SignInType = "password" | "email" | "oauth" | "otp";

const AuthContext = createContext<AuthContext | null>(null);

export function useAuth() {
  if (!AuthContext) throw new Error("Auth context must be used within Auth Provider");
  return AuthContext;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const value = {
    login: (type: SignInType) => {
      switch (type) {
        case "email":
          break;
        case "password":
          break;
        case "oauth":
          break;
        case "otp":
          break;
      }
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

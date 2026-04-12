import { createContext, useContext } from "react";
import type {
  SignInWithPasswordCredentials,
  SignInWithOAuthCredentials,
  SignUpWithPasswordCredentials,
  Provider,
  User,
} from "@supabase/supabase-js";

type AllowedProvider = Extract<Provider, "google" | "github">;

type MyOAuthCredentials = Omit<SignInWithOAuthCredentials, "provider"> & {
  provider: AllowedProvider;
};

type LoginParams =
  | { type: "email"; credentials: SignInWithPasswordCredentials }
  | { type: "oauth"; credentials: MyOAuthCredentials };

export interface AuthContextValue {
  user: User | null;
  login: (params: LoginParams) => void;
  logout: () => void;
  createUser: (credentials: SignUpWithPasswordCredentials) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("Auth context must be used within Auth Provider");
  return context;
}

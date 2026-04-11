import { AuthContext, type AuthContextValue } from "@/infra/auth/auth.context";
import { supabase } from "@/infra/auth/auth.client";
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const api: AuthContextValue = {
    async login(params) {
      switch (params.type) {
        case "email":
          await supabase.auth.signInWithPassword(params.credentials);
          break;
        case "oauth":
          await supabase.auth.signInWithOAuth(params.credentials);
          break;
      }
    },
    async logout() {
      await supabase.auth.signOut();
    },
    async createUser(params) {
      await supabase.auth.signUp(params);
    },
  };
  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}

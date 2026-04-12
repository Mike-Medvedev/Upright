import { AuthContext, type AuthContextValue } from "@/infra/auth/auth.context";
import { supabase } from "@/infra/auth/auth.client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);
  const api: AuthContextValue = {
    user,
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

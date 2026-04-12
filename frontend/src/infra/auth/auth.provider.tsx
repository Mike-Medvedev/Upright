import { AuthContext } from "@/infra/auth/auth.context";
import { supabase } from "@/infra/auth/auth.client";
import {
  createOAuthCredentials,
  getSignUpRedirectOptions,
  getSignUpResult,
  parseLoginCredentials,
  parseSignUpCredentials,
  toApplicationError,
} from "@/infra/auth/auth.service";
import type { AuthContextValue } from "@/features/auth/auth.types";
import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");

  useEffect(() => {
    let isMounted = true;

    const applySession = (session: Session | null) => {
      if (!isMounted) {
        return;
      }

      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setStatus(nextUser ? "authenticated" : "unauthenticated");
    };

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          throw toApplicationError(error, "Unable to restore your session.");
        }

        applySession(data.session);
      })
      .catch((error) => {
        console.error(error);
        applySession(null);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      applySession(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const api: AuthContextValue = {
    createUser: async (credentials) => {
      try {
        const parsedCredentials = parseSignUpCredentials(credentials);
        const { confirmPassword: _confirmPassword, ...signUpCredentials } = parsedCredentials;
        const { data, error } = await supabase.auth.signUp({
          ...signUpCredentials,
          options: getSignUpRedirectOptions(),
        });

        if (error) {
          throw error;
        }

        return getSignUpResult(signUpCredentials.email, Boolean(data.session));
      } catch (error) {
        throw toApplicationError(error, "Unable to create your account.");
      }
    },
    login: async (params) => {
      try {
        if (params.type === "email") {
          const credentials = parseLoginCredentials(params.credentials);
          const { error } = await supabase.auth.signInWithPassword(credentials);

          if (error) {
            throw error;
          }

          return;
        }

        const { error } = await supabase.auth.signInWithOAuth(
          createOAuthCredentials(params.credentials.provider),
        );

        if (error) {
          throw error;
        }
      } catch (error) {
        throw toApplicationError(error, "Unable to sign you in.");
      }
    },
    logout: async () => {
      try {
        const { error } = await supabase.auth.signOut();

        if (error) {
          throw error;
        }
      } catch (error) {
        throw toApplicationError(error, "Unable to sign you out.");
      }
    },
    status,
    user,
  };

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}

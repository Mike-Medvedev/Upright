/**
 * This module provides an Auth Context that exposes an API using Supabase Client
 * to authenticate users and manage user sessions
 */

import { AuthContext } from "@/infra/auth/auth.context";
import { supabase } from "@/infra/auth/auth.client";
import { authService } from "@/infra/auth/auth.service";
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

    // promise used as a fire and forget, it either calls or applySession or onAuthStateChange does, both end up setting the session
    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          throw authService.toApplicationError(error, "Unable to restore your session.");
        }

        applySession(data.session);
      })
      .catch((error) => {
        console.error(error);
        applySession(null);
      });

    // Primary mechanism for updating webapps auth state through supabase auth changes
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
        const { email, password } = authService.parseSignUpCredentials(credentials);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: authService.getSignUpRedirectOptions(),
        });

        if (error) {
          throw error;
        }

        return authService.getSignUpResult(email, Boolean(data.session));
      } catch (error) {
        throw authService.toApplicationError(error, "Unable to create your account.");
      }
    },
    login: async (params) => {
      try {
        if (params.type === "email") {
          const credentials = authService.parseLoginCredentials(params.credentials);
          const { error } = await supabase.auth.signInWithPassword(credentials);

          if (error) {
            throw error;
          }

          return;
        }

        const { error } = await supabase.auth.signInWithOAuth(
          authService.createOAuthCredentials(params.credentials.provider),
        );

        if (error) {
          throw error;
        }
      } catch (error) {
        throw authService.toApplicationError(error, "Unable to sign you in.");
      }
    },
    logout: async () => {
      try {
        const { error } = await supabase.auth.signOut();

        if (error) {
          throw error;
        }
      } catch (error) {
        throw authService.toApplicationError(error, "Unable to sign you out.");
      }
    },
    status,
    user,
  };

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}

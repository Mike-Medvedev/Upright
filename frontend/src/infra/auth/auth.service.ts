import { AuthError as SupabaseAuthError } from "@supabase/supabase-js";
import { z } from "zod/v4";
import {
  AuthenticationError,
  ConfigurationError,
  ValidationError,
  type ApplicationError,
} from "@/lib/errors";
import type {
  AuthSignUpResult,
  LoginValues,
  OAuthProvider,
  SignUpValues,
} from "@/features/auth/auth.types";
import { loginSchema, signUpSchema } from "@/features/auth/auth.types";

const OAUTH_CALLBACK_PATH = "/auth/callback";

export const authService = {
  parseLoginCredentials(values: LoginValues) {
    return loginSchema.parse(values);
  },

  parseSignUpCredentials(values: SignUpValues) {
    return signUpSchema.parse(values);
  },

  getOAuthRedirectUrl() {
    return new URL(OAUTH_CALLBACK_PATH, window.location.origin).toString();
  },

  createOAuthCredentials(provider: OAuthProvider) {
    return {
      options: {
        redirectTo: authService.getOAuthRedirectUrl(),
      },
      provider,
    } as const;
  },

  getSignUpRedirectOptions() {
    return {
      emailRedirectTo: authService.getOAuthRedirectUrl(),
    } as const;
  },

  getSignUpResult(email: string, hasSession: boolean): AuthSignUpResult {
    if (hasSession) {
      return { status: "signed-in" };
    }

    return {
      email,
      status: "email-confirmation-required",
    };
  },

  toApplicationError(error: unknown, fallbackMessage: string): ApplicationError {
    if (error instanceof z.ZodError) {
      return new ValidationError(
        "The submitted authentication data is invalid.",
        {
          issues: z.treeifyError(error),
        },
        error,
      );
    }

    if (error instanceof SupabaseAuthError) {
      return new AuthenticationError(error.message || fallbackMessage, undefined, error);
    }

    if (error instanceof Error) {
      return new AuthenticationError(error.message || fallbackMessage, undefined, error);
    }

    return new ConfigurationError(fallbackMessage, { error }, error);
  },
};

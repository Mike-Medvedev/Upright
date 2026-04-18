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

export function parseLoginCredentials(values: LoginValues) {
  return loginSchema.parse(values);
}

export function parseSignUpCredentials(values: SignUpValues) {
  return signUpSchema.parse(values);
}

export function getOAuthRedirectUrl() {
  return new URL(OAUTH_CALLBACK_PATH, window.location.origin).toString();
}

export function createOAuthCredentials(provider: OAuthProvider) {
  return {
    options: {
      redirectTo: getOAuthRedirectUrl(),
    },
    provider,
  } as const;
}

export function getSignUpRedirectOptions() {
  return {
    emailRedirectTo: getOAuthRedirectUrl(),
  } as const;
}

export function getSignUpResult(email: string, hasSession: boolean): AuthSignUpResult {
  if (hasSession) {
    return { status: "signed-in" };
  }

  return {
    email,
    status: "email-confirmation-required",
  };
}

export function toApplicationError(error: unknown, fallbackMessage: string): ApplicationError {
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
}

import type { User } from "@supabase/supabase-js";
import { z } from "zod/v4";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const signUpSchema = loginSchema
  .extend({
    confirmPassword: z.string().min(8, "Confirm your password."),
  })
  .superRefine(({ confirmPassword, password }, context) => {
    if (password !== confirmPassword) {
      context.addIssue({
        code: "custom",
        message: "Passwords must match.",
        path: ["confirmPassword"],
      });
    }
  });

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";
export type LoginValues = z.infer<typeof loginSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export type OAuthProvider = "google" | "github";
export type AuthLoginParams =
  | { type: "email"; credentials: LoginValues }
  | { type: "oauth"; credentials: { provider: OAuthProvider } };
export type AuthSignUpResult =
  | { status: "signed-in" }
  | { status: "email-confirmation-required"; email: string };

export interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  login: (params: AuthLoginParams) => Promise<void>;
  logout: () => Promise<void>;
  createUser: (credentials: SignUpValues) => Promise<AuthSignUpResult>;
}

export const oAuthProviders = [
  { label: "Continue with Google", value: "google" },
  { label: "Continue with GitHub", value: "github" },
] as const satisfies ReadonlyArray<{ label: string; value: OAuthProvider }>;

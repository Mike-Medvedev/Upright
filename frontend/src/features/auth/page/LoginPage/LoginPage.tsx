import {
  Alert,
  Anchor,
  Button,
  Divider,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { type OAuthProvider, loginSchema, oAuthProviders } from "@/features/auth/auth.types";
import { AuthShell } from "@/features/auth/components/AuthShell/AuthShell";
import { ApplicationError } from "@/lib/errors";
import { useAuth } from "@/infra/auth/auth.context";

function getErrorMessage(error: unknown) {
  if (error instanceof ApplicationError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "We could not sign you in. Please try again.";
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(
    searchParams.get("error") === "oauth_callback"
      ? "OAuth sign-in did not complete. Please try again."
      : null,
  );
  const [pendingProvider, setPendingProvider] = useState<OAuthProvider | "email" | null>(null);

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validate: zod4Resolver(loginSchema),
  });

  const isSubmittingEmail = pendingProvider === "email";
  const isPending = pendingProvider !== null;

  const handleSubmit = form.onSubmit(async (values) => {
    setErrorMessage(null);
    setPendingProvider("email");

    try {
      await login({
        credentials: values,
        type: "email",
      });
      navigate("/home", { replace: true });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setPendingProvider(null);
    }
  });

  const handleOAuth = async (provider: OAuthProvider) => {
    setErrorMessage(null);
    setPendingProvider(provider);

    try {
      await login({
        credentials: { provider },
        type: "oauth",
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      setPendingProvider(null);
    }
  };

  return (
    <AuthShell
      description="Use email and password or continue with a trusted OAuth provider."
      footer={
        <Text>
          Don&apos;t have an account?{" "}
          <Anchor component={Link} to="/signup">
            Create one
          </Anchor>
        </Text>
      }
      title="Sign in"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {errorMessage ? <Alert color="red">{errorMessage}</Alert> : null}

          <TextInput
            autoComplete="email"
            label="Email"
            placeholder="you@example.com"
            {...form.getInputProps("email")}
          />
          <PasswordInput
            autoComplete="current-password"
            label="Password"
            placeholder="Your password"
            {...form.getInputProps("password")}
          />
          <Button fullWidth loading={isSubmittingEmail} type="submit">
            Sign in
          </Button>
        </Stack>
      </form>

      <Divider label="or continue with" labelPosition="center" my="lg" />

      <Stack gap="sm">
        {oAuthProviders.map((provider) => (
          <Button
            disabled={isPending}
            fullWidth
            key={provider.value}
            loading={pendingProvider === provider.value}
            onClick={() => void handleOAuth(provider.value)}
            variant="default"
          >
            {provider.label}
          </Button>
        ))}
      </Stack>
    </AuthShell>
  );
}

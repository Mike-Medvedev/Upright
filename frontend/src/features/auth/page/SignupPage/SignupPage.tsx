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
import { Link, useNavigate } from "react-router";
import { ApplicationError } from "@/lib/errors";
import { AuthShell } from "@/features/auth/components/AuthShell/AuthShell";
import { type OAuthProvider, oAuthProviders, signUpSchema } from "@/features/auth/auth.types";
import { useAuth } from "@/infra/auth/auth.context";

function getErrorMessage(error: unknown) {
  if (error instanceof ApplicationError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "We could not create your account. Please try again.";
}

export function SignupPage() {
  const { createUser, login } = useAuth();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [pendingProvider, setPendingProvider] = useState<OAuthProvider | "email" | null>(null);

  const form = useForm({
    initialValues: {
      confirmPassword: "",
      email: "",
      password: "",
    },
    validate: zod4Resolver(signUpSchema),
  });

  const isSubmittingEmail = pendingProvider === "email";
  const isPending = pendingProvider !== null;

  const handleSubmit = form.onSubmit(async (values) => {
    setErrorMessage(null);
    setNoticeMessage(null);
    setPendingProvider("email");

    try {
      const result = await createUser(values);

      if (result.status === "signed-in") {
        navigate("/monitoring", { replace: true });
        return;
      }

      setNoticeMessage(`Check ${result.email} for your confirmation email, then come back to sign in.`);
      form.reset();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setPendingProvider(null);
    }
  });

  const handleOAuth = async (provider: OAuthProvider) => {
    setErrorMessage(null);
    setNoticeMessage(null);
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
      description="Create an account with email and password or jump in with an OAuth provider."
      footer={
        <Text>
          Already have an account?{" "}
          <Anchor component={Link} to="/login">
            Sign in
          </Anchor>
        </Text>
      }
      title="Create account"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {errorMessage ? <Alert color="red">{errorMessage}</Alert> : null}
          {noticeMessage ? <Alert color="grape">{noticeMessage}</Alert> : null}

          <TextInput
            autoComplete="email"
            label="Email"
            placeholder="you@example.com"
            {...form.getInputProps("email")}
          />
          <PasswordInput
            autoComplete="new-password"
            label="Password"
            placeholder="Create a password"
            {...form.getInputProps("password")}
          />
          <PasswordInput
            autoComplete="new-password"
            label="Confirm password"
            placeholder="Repeat your password"
            {...form.getInputProps("confirmPassword")}
          />
          <Button fullWidth loading={isSubmittingEmail} type="submit">
            Create account
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

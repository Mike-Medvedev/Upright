import { Loader, Stack, Text, Title } from "@mantine/core";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { AuthShell } from "@/features/auth/components/AuthShell/AuthShell";
import { useAuth } from "@/infra/auth/auth.context";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "authenticated") {
      navigate("/monitoring", { replace: true });
    }

    if (status === "unauthenticated") {
      navigate("/login?error=oauth_callback", { replace: true });
    }
  }, [navigate, status]);

  return (
    <AuthShell
      description="We are finishing your authentication handshake."
      footer={<Text>Redirecting you to the right place.</Text>}
      title="Signing you in"
    >
      <Stack align="center" gap="md">
        <Loader color="grape" />
        <Title order={3}>Completing sign-in</Title>
        <Text c="dimmed" ta="center">
          This usually takes just a moment.
        </Text>
      </Stack>
    </AuthShell>
  );
}

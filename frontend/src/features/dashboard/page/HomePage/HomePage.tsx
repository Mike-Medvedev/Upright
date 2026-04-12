import { Badge, Button, Group, Stack, Text, Title } from "@mantine/core";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/infra/auth/auth.context";
import "./HomePage.css";

export function HomePage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleLogout = async () => {
    setIsSigningOut(true);

    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="homePage">
      <div className="homePageCard">
        <Stack gap="lg">
          <div>
            <Badge color="grape" variant="light">
              Auth ready
            </Badge>
            <Title mt="md" order={1}>
              You&apos;re signed in.
            </Title>
            <Text c="dimmed" mt="sm">
              The frontend auth flow is now wired for email login, sign-up, and OAuth providers with
              protected routing and shared error handling.
            </Text>
          </div>

          <div>
            <Text fw={600}>Current user</Text>
            <Text c="dimmed">{user?.email ?? "No email available"}</Text>
          </div>

          <Group className="homePageMeta">
            <Button loading={isSigningOut} onClick={handleLogout}>
              Sign out
            </Button>
          </Group>
        </Stack>
      </div>
    </div>
  );
}

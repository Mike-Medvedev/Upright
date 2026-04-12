import { AppShell, Avatar, Box, Group, Loader, Menu, NavLink, Stack, Text, Title } from "@mantine/core";
import { useState } from "react";
import { NavLink as RouterNavLink, Outlet, useLocation, useNavigate } from "react-router";
import { useAuth } from "@/infra/auth/auth.context";
import { AppLogo } from "@/theme/components/AppLogo/AppLogo";
import "./AppLayout.css";

function getInitials(email: string | undefined): string {
  if (!email) {
    return "?";
  }

  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]/u).filter(Boolean);

  if (parts.length >= 2) {
    const a = parts[0]?.[0];
    const b = parts[1]?.[0];
    if (a && b) {
      return `${a}${b}`.toUpperCase();
    }
  }

  return local.slice(0, 2).toUpperCase() || "?";
}

export function AppLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const email = user?.email ?? "";
  const initials = getInitials(email);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <AppShell
      classNames={{ root: "appLayoutRoot" }}
      header={{ height: 56 }}
      navbar={{ breakpoint: "sm", width: 260 }}
      padding="md"
    >
      <AppShell.Header className="appLayoutHeader">
        <Group className="appLayoutHeaderInner" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <AppLogo />
            <Title className="appLayoutTitle" order={3}>
              Upright
            </Title>
          </Group>

          <Menu position="bottom-end" shadow="md" width={260}>
            <Menu.Target>
              <button
                aria-label="Account menu"
                className="appLayoutAvatarTrigger"
                disabled={isLoggingOut}
                type="button"
              >
                {isLoggingOut ? (
                  <Loader color="grape" size="sm" />
                ) : (
                  <Avatar color="grape" radius="xl" size="md">
                    {initials}
                  </Avatar>
                )}
              </button>
            </Menu.Target>
            <Menu.Dropdown>
              <Box px="sm" py="xs">
                <Text c="dimmed" size="xs">
                  Signed in as
                </Text>
                <Text size="sm" truncate>
                  {email || "—"}
                </Text>
              </Box>
              <Menu.Divider />
              <Menu.Item onClick={() => navigate("/settings")}>Settings</Menu.Item>
              <Menu.Item color="red" disabled={isLoggingOut} onClick={() => void handleLogout()}>
                {isLoggingOut ? "Signing out…" : "Log out"}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar className="appLayoutNavbar" p="md">
        <Stack gap={4}>
          <NavLink
            active={location.pathname === "/monitoring"}
            className="appLayoutNavLink"
            component={RouterNavLink}
            label="Monitoring"
            to="/monitoring"
          />
          <NavLink
            active={location.pathname === "/analytics"}
            className="appLayoutNavLink"
            component={RouterNavLink}
            label="Analytics"
            to="/analytics"
          />
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main className="appLayoutMain">
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

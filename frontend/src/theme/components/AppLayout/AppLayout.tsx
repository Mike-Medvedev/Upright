import { AppShell, Avatar, Box, Group, Loader, Menu, NavLink, Stack, Text, Title } from "@mantine/core";
import { IconChartBar, IconSettings, IconVideo } from "@tabler/icons-react";
import { useState } from "react";
import { useMonitoring } from "@/features/monitoring/context/monitoring.context";
import { MonitoringProvider } from "@/features/monitoring/context/monitoring.provider";
import { NavLink as RouterNavLink, Outlet, useLocation, useNavigate } from "react-router";
import { useAuth } from "@/infra/auth/auth.context";
import { AppLogo } from "@/theme/components/AppLogo/AppLogo";
import "./AppLayout.css";

function getAvatarLetter(email: string | undefined): string {
  if (!email) {
    return "?";
  }

  const local = email.split("@")[0]?.trim() ?? "";
  const first = local[0];

  return first ? first.toUpperCase() : "?";
}

const navLinkClassNames = {
  label: "appLayoutNavLinkLabel",
  root: "appLayoutNavLink",
  section: "appLayoutNavLinkSection",
} as const;

export function AppLayout() {
  return (
    <MonitoringProvider>
      <AppLayoutShell />
    </MonitoringProvider>
  );
}

function AppLayoutShell() {
  const { logout, user } = useAuth();
  const { state: monitoringState } = useMonitoring();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const email = user?.email ?? "";
  const avatarLetter = getAvatarLetter(email);

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
                  <Avatar
                    classNames={{
                      placeholder: "appLayoutAvatarPlaceholder",
                      root: "appLayoutAvatarRoot",
                    }}
                    color="grape"
                    radius="xl"
                    size={32}
                    variant="light"
                  >
                    {avatarLetter}
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
        <Stack className="appLayoutNavbarInner" flex={1} gap="md" justify="space-between">
          <Stack gap={6}>
            <NavLink
              active={location.pathname === "/monitoring"}
              classNames={navLinkClassNames}
              color="grape"
              component={RouterNavLink}
              label="Monitoring"
              leftSection={<IconVideo className="appLayoutNavIcon" size={18} stroke={1.5} />}
              rightSection={
                <span
                  aria-hidden="true"
                  className={`appLayoutNavStatus appLayoutNavStatus_${monitoringState.status}`}
                />
              }
              to="/monitoring"
              variant="subtle"
            />
            <NavLink
              active={location.pathname === "/analytics"}
              classNames={navLinkClassNames}
              color="grape"
              component={RouterNavLink}
              label="Analytics"
              leftSection={<IconChartBar className="appLayoutNavIcon" size={18} stroke={1.5} />}
              to="/analytics"
              variant="subtle"
            />
          </Stack>
          <NavLink
            active={location.pathname === "/settings"}
            classNames={navLinkClassNames}
            color="grape"
            component={RouterNavLink}
            label="Settings"
            leftSection={<IconSettings className="appLayoutNavIcon" size={18} stroke={1.5} />}
            to="/settings"
            variant="subtle"
          />
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main className="appLayoutMain">
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

import { Alert, Button, Group, Stack, Switch, Text, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { useMonitoring } from "@/features/monitoring/context/monitoring.context";
import { monitoringAlertsService } from "@/features/monitoring/service/monitoring-alerts.service";
import type { BrowserNotificationPermissionState } from "@/features/monitoring/monitoring.types";
import "@/features/settings/page/SettingsPage/SettingsPage.css";

export function SettingsPage() {
  const { alertPreferences, updateAlertPreferences } = useMonitoring();
  const [isRequestingNotificationPermission, setIsRequestingNotificationPermission] =
    useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<BrowserNotificationPermissionState>(() =>
      monitoringAlertsService.getDesktopNotificationPermission(),
    );

  useEffect(() => {
    const syncNotificationPermission = () => {
      setNotificationPermission(monitoringAlertsService.getDesktopNotificationPermission());
    };

    syncNotificationPermission();
    window.addEventListener("focus", syncNotificationPermission);
    document.addEventListener("visibilitychange", syncNotificationPermission);

    return () => {
      window.removeEventListener("focus", syncNotificationPermission);
      document.removeEventListener("visibilitychange", syncNotificationPermission);
    };
  }, []);

  const handleSoundToggle = (checked: boolean) => {
    updateAlertPreferences({ soundEnabled: checked });
  };

  const handleDesktopNotificationsToggle = async (checked: boolean) => {
    updateAlertPreferences({ desktopNotificationsEnabled: checked });

    if (!checked) {
      setNotificationPermission(monitoringAlertsService.getDesktopNotificationPermission());
      return;
    }

    setIsRequestingNotificationPermission(true);

    try {
      const permission = await monitoringAlertsService.requestDesktopNotificationPermission();
      setNotificationPermission(permission);
    } finally {
      setIsRequestingNotificationPermission(false);
    }
  };

  return (
    <Stack className="settingsPage" gap="lg">
      <div>
        <Title order={2}>Settings</Title>
      </div>

      <div className="settingsSection">
        <Title className="settingsSectionTitle" order={4}>
          Monitoring alerts
        </Title>
        <Text c="dimmed" size="sm">
          Choose how Upright should alert you when bad posture lasts for a few seconds.
        </Text>

        <Group className="settingsToggleRow" justify="space-between" wrap="wrap">
          <div className="settingsToggleCopy">
            <Text fw={600}>Voice alert</Text>
            <Text c="dimmed" size="sm">
              Speak “Bad posture detected” when sustained bad posture is detected.
            </Text>
          </div>
          <Switch
            aria-label="Enable posture voice alerts"
            checked={alertPreferences.soundEnabled}
            className="settingsToggleSwitch"
            onChange={(event) => handleSoundToggle(event.currentTarget.checked)}
          />
        </Group>

        <Group className="settingsToggleRow" justify="space-between" wrap="wrap">
          <div className="settingsToggleCopy">
            <Text fw={600}>Desktop notifications</Text>
            <Text c="dimmed" size="sm">
              Show a system popup when the monitoring tab is open but not currently visible.
            </Text>
            <Text className="settingsSupportText" size="xs">
              {getNotificationPermissionMessage(notificationPermission)}
            </Text>
          </div>
          <Switch
            aria-label="Enable desktop posture notifications"
            checked={alertPreferences.desktopNotificationsEnabled}
            className="settingsToggleSwitch"
            disabled={isRequestingNotificationPermission}
            onChange={(event) => {
              void handleDesktopNotificationsToggle(event.currentTarget.checked);
            }}
          />
        </Group>
      </div>

      <Alert className="settingsDangerZone" color="red" title="Delete account" variant="light">
        <Text size="sm">Permanent. Your data cannot be recovered.</Text>
        <Button
          className="settingsDeleteButton"
          color="red"
          mt="md"
          onClick={() => {
            console.info("Delete account (not implemented)");
          }}
          variant="filled">
          Delete account
        </Button>
      </Alert>
    </Stack>
  );
}

function getNotificationPermissionMessage(permission: BrowserNotificationPermissionState) {
  switch (permission) {
    case "granted":
      return "Browser permission granted. Notifications can appear outside Chrome.";
    case "denied":
      return "Browser permission is blocked. Re-enable notifications from your site settings in Chrome.";
    case "unsupported":
      return "This browser does not support desktop notifications for Upright.";
    default:
      return "Browser permission has not been granted yet. Upright will ask the next time notifications are enabled or monitoring starts.";
  }
}

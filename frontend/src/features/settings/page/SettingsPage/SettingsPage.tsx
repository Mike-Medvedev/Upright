import { Alert, Button, Stack, Switch, Text, Title } from "@mantine/core";
import { SETTINGS_POSTURE_PLACEHOLDERS } from "@/features/monitoring/monitoring.types";
import "./SettingsPage.css";

export function SettingsPage() {
  return (
    <Stack className="settingsPage" gap="lg">
      <div>
        <Title order={2}>Settings</Title>
        <Text c="dimmed" mt="xs" size="sm">
          Account and posture preferences.
        </Text>
      </div>

      <div className="settingsSection">
        <Title className="settingsSectionTitle" order={4}>
          Posture &amp; alerts
        </Title>
        <Text c="dimmed" mb="md" size="sm">
          These controls will tune monitoring behavior. They are not connected yet—placeholders for upcoming
          work.
        </Text>
        <Stack gap="md">
          {SETTINGS_POSTURE_PLACEHOLDERS.map((item) => (
            <div className="settingsPlaceholderRow" key={item.id}>
              <Switch
                aria-describedby={`${item.id}-desc`}
                checked={false}
                disabled
                id={item.id}
                label={item.label}
                offLabel="Off"
                onLabel="On"
              />
              <Text c="dimmed" id={`${item.id}-desc`} size="xs">
                {item.description}
              </Text>
            </div>
          ))}
        </Stack>
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
          variant="filled"
        >
          Delete account
        </Button>
      </Alert>
    </Stack>
  );
}

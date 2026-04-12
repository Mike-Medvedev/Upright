import { Alert, Button, Stack, Text, Title } from "@mantine/core";
import "./SettingsPage.css";

export function SettingsPage() {
  return (
    <Stack className="settingsPage" gap="lg">
      <div>
        <Title order={2}>Settings</Title>
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

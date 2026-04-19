import { Loader, Stack, Text, Title } from "@mantine/core";
import "@/theme/components/AppLoadingView/AppLoadingView.css";

interface AppLoadingViewProps {
  description: string;
  title: string;
}

export function AppLoadingView({ description, title }: AppLoadingViewProps) {
  return (
    <div className="appLoadingView">
      <div className="appLoadingPanel">
        <Stack align="center" gap="md">
          <Loader color="grape" />
          <Title order={2}>{title}</Title>
          <Text c="dimmed">{description}</Text>
        </Stack>
      </div>
    </div>
  );
}

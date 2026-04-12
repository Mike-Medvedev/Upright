import { Group, Paper, Progress, RingProgress, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import "./AnalyticsPage.css";

export function AnalyticsPage() {
  return (
    <Stack className="analyticsPage" gap="lg">
      <div>
        <Title order={2}>Analytics</Title>
        <Text c="dimmed" mt="xs" size="sm">
          Session posture trends (sample data).
        </Text>
      </div>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <Paper className="analyticsStat" p="md" radius="md" withBorder>
          <Text c="dimmed" size="xs" tt="uppercase">
            Slouch rate
          </Text>
          <Text className="analyticsStatValue" fw={700} mt="xs">
            18%
          </Text>
          <Text c="dimmed" mt={4} size="xs">
            Last 7 days
          </Text>
        </Paper>
        <Paper className="analyticsStat" p="md" radius="md" withBorder>
          <Text c="dimmed" size="xs" tt="uppercase">
            Sessions
          </Text>
          <Text className="analyticsStatValue" fw={700} mt="xs">
            24
          </Text>
          <Text c="dimmed" mt={4} size="xs">
            Total tracked
          </Text>
        </Paper>
        <Paper className="analyticsStat" p="md" radius="md" withBorder>
          <Text c="dimmed" size="xs" tt="uppercase">
            Best streak
          </Text>
          <Text className="analyticsStatValue" fw={700} mt="xs">
            3h 12m
          </Text>
          <Text c="dimmed" mt={4} size="xs">
            Upright focus
          </Text>
        </Paper>
      </SimpleGrid>

      <Paper className="analyticsRingCard" p="lg" radius="md" withBorder>
        <Group align="flex-start" gap="xl" wrap="wrap">
          <RingProgress
            label={
              <Text fw={700} size="lg" ta="center">
                18%
              </Text>
            }
            sections={[{ color: "grape", value: 18 }]}
            size={160}
            thickness={16}
          />
          <Stack className="analyticsRingCopy" gap="sm">
            <Title order={4}>Slouching share</Title>
            <Text c="dimmed" size="sm">
              Estimated portion of active time spent slouching across recent sessions.
            </Text>
            <Text fw={600} size="sm">
              Today vs last week
            </Text>
            <Progress color="grape" radius="md" size="lg" value={62} />
            <Text c="dimmed" size="xs">
              Sample comparison — 62% of your prior week average.
            </Text>
          </Stack>
        </Group>
      </Paper>
    </Stack>
  );
}

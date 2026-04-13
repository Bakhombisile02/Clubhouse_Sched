import {
  SimpleGrid,
  Paper,
  Text,
  Title,
  Group,
  Anchor,
  Box,
  ThemeIcon,
} from '@mantine/core';
import {
  IconUsers,
  IconPool,
  IconCalendar,
  IconTrophy,
  IconCalendarEvent,
  IconMapPin,
  IconWorld,
} from '@tabler/icons-react';

export default function OverviewTab({ data }) {
  if (!data) return null;

  const info = data.pools?.eventInfo || {};
  const title = info.title || 'Hoop Nation Junior Showcase';
  const dates = info.dates || '15–18 April 2026';
  const location = info.location || 'Whanganui, NZ';

  const teamCount = (data.teams?.teams || []).length;
  const poolCount = (data.pools?.pools || []).length;
  const fixtureCount = (data.fixtures?.fixtures || []).length;
  const resultCount = (data.results?.results || []).length;

  const stats = [
    {
      label: 'Teams',
      value: teamCount,
      icon: IconUsers,
      color: 'orange',
    },
    {
      label: 'Pools',
      value: poolCount,
      icon: IconPool,
      color: 'blue',
    },
    {
      label: 'Fixtures',
      value: fixtureCount,
      icon: IconCalendar,
      color: 'violet',
    },
    {
      label: 'Results',
      value: resultCount,
      icon: IconTrophy,
      color: 'green',
    },
  ];

  return (
    <Box pt="md">
      {/* Event Info Card */}
      <Paper shadow="sm" p="xl" radius="md" mb="lg" withBorder>
        <Title order={3} c="orange" mb="sm">
          {title}
        </Title>
        <Group gap="xl" wrap="wrap">
          <Group gap="xs">
            <ThemeIcon variant="light" color="orange" size="sm">
              <IconCalendarEvent size={14} />
            </ThemeIcon>
            <Text size="sm" c="dimmed">
              {dates}
            </Text>
          </Group>
          <Group gap="xs">
            <ThemeIcon variant="light" color="orange" size="sm">
              <IconMapPin size={14} />
            </ThemeIcon>
            <Text size="sm" c="dimmed">
              {location}
            </Text>
          </Group>
          <Group gap="xs">
            <ThemeIcon variant="light" color="orange" size="sm">
              <IconWorld size={14} />
            </ThemeIcon>
            <Anchor
              href="https://www.hoopnation.basketball/tournaments/junior-showcase"
              target="_blank"
              rel="noopener"
              size="sm"
            >
              Official site
            </Anchor>
          </Group>
        </Group>
      </Paper>

      {/* Stats Grid */}
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
        {stats.map((stat) => (
          <Paper
            key={stat.label}
            shadow="sm"
            p="lg"
            radius="md"
            withBorder
            style={{ textAlign: 'center' }}
          >
            <ThemeIcon
              variant="light"
              color={stat.color}
              size="lg"
              radius="xl"
              mx="auto"
              mb="xs"
            >
              <stat.icon size={20} />
            </ThemeIcon>
            <Text
              fw={700}
              fz="2rem"
              lh={1}
              c={stat.color}
            >
              {stat.value}
            </Text>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} mt={4}>
              {stat.label}
            </Text>
          </Paper>
        ))}
      </SimpleGrid>
    </Box>
  );
}

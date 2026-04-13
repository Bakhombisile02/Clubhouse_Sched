import { useState } from 'react';
import {
  SimpleGrid,
  Paper,
  Text,
  Title,
  TextInput,
  Group,
  Alert,
  Badge,
  Box,
} from '@mantine/core';
import { IconSearch, IconAlertCircle } from '@tabler/icons-react';

export default function TeamsTab({ teamsData }) {
  const [search, setSearch] = useState('');

  if (!teamsData) return null;

  if (teamsData.error) {
    return (
      <Alert
        icon={<IconAlertCircle size={16} />}
        title="Error loading teams"
        color="red"
        variant="light"
        mt="md"
      >
        {teamsData.error}
      </Alert>
    );
  }

  const teams = teamsData.teams || [];

  if (teams.length === 0) {
    return (
      <Box pt="xl" style={{ textAlign: 'center' }}>
        <Text c="dimmed" size="sm">
          No team data available yet. Check back closer to the event.
        </Text>
      </Box>
    );
  }

  const filtered = teams.filter((team) => {
    const q = search.toLowerCase();
    return (
      team.name.toLowerCase().includes(q) ||
      (team.division || '').toLowerCase().includes(q) ||
      (team.pool || '').toLowerCase().includes(q)
    );
  });

  return (
    <Box pt="md">
      <Group justify="space-between" mb="md" wrap="wrap" gap="sm">
        <Title order={4}>Registered Teams</Title>
        <TextInput
          placeholder="Search teams…"
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ width: 240 }}
          size="sm"
        />
      </Group>

      <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 4 }} spacing="sm">
        {filtered.map((team, i) => (
          <Paper
            key={`${team.name}-${i}`}
            shadow="xs"
            p="sm"
            radius="md"
            withBorder
            style={{
              transition: 'box-shadow 0.15s ease',
              cursor: 'default',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                '0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -1px rgba(0,0,0,.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <Text fw={600} size="sm">
              {team.name}
            </Text>
            <Group gap="xs" mt={4}>
              {team.division && (
                <Badge size="xs" variant="light" color="blue">
                  {team.division}
                </Badge>
              )}
              {team.pool && (
                <Badge size="xs" variant="light" color="orange">
                  Pool {team.pool}
                </Badge>
              )}
            </Group>
          </Paper>
        ))}
      </SimpleGrid>

      {filtered.length === 0 && search && (
        <Text c="dimmed" ta="center" mt="xl" size="sm">
          No teams matching &ldquo;{search}&rdquo;
        </Text>
      )}
    </Box>
  );
}

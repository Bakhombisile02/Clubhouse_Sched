import { useState } from 'react';
import {
  Table,
  Paper,
  Text,
  Title,
  TextInput,
  Group,
  Alert,
  Badge,
  Box,
  ScrollArea,
} from '@mantine/core';
import { IconSearch, IconAlertCircle, IconMapPin } from '@tabler/icons-react';

function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/([A-Z])/g, ' $1');
}

export default function FixturesTab({ fixturesData }) {
  const [search, setSearch] = useState('');

  if (!fixturesData) return null;

  if (fixturesData.error) {
    return (
      <Alert
        icon={<IconAlertCircle size={16} />}
        title="Error loading fixtures"
        color="red"
        variant="light"
        mt="md"
      >
        {fixturesData.error}
      </Alert>
    );
  }

  const fixtures = fixturesData.fixtures || [];

  if (fixtures.length === 0) {
    return (
      <Box pt="xl" style={{ textAlign: 'center' }}>
        <Text c="dimmed" size="sm">
          Fixtures not yet published. Check back closer to the event.
        </Text>
      </Box>
    );
  }

  // Group by venue
  const byVenue = {};
  fixtures.forEach((f) => {
    const venue = f.venue || 'Unknown Venue';
    if (!byVenue[venue]) byVenue[venue] = [];
    byVenue[venue].push(f);
  });

  const q = search.toLowerCase();

  return (
    <Box pt="md">
      <Group justify="space-between" mb="md" wrap="wrap" gap="sm">
        <Title order={4}>Game Fixtures</Title>
        <TextInput
          placeholder="Search teams / courts…"
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ width: 260 }}
          size="sm"
        />
      </Group>

      {Object.entries(byVenue).map(([venue, games]) => {
        const keys = Object.keys(games[0]).filter((k) => k !== 'venue');

        const filteredGames = q
          ? games.filter((g) =>
              keys.some((k) =>
                String(g[k] || '')
                  .toLowerCase()
                  .includes(q)
              )
            )
          : games;

        if (filteredGames.length === 0) return null;

        return (
          <Box key={venue} mb="lg">
            <Badge
              leftSection={<IconMapPin size={12} />}
              color="orange"
              variant="filled"
              size="md"
              mb="xs"
            >
              {venue}
            </Badge>
            <Paper shadow="sm" radius="md" withBorder>
              <ScrollArea>
                <Table
                  striped
                  highlightOnHover
                  withColumnBorders={false}
                  horizontalSpacing="md"
                  verticalSpacing="sm"
                  fz="sm"
                >
                  <Table.Thead
                    style={{
                      backgroundColor: '#0f172a',
                    }}
                  >
                    <Table.Tr>
                      {keys.map((k) => (
                        <Table.Th
                          key={k}
                          style={{
                            color: 'white',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {capitalise(k)}
                        </Table.Th>
                      ))}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredGames.map((game, i) => (
                      <Table.Tr key={i}>
                        {keys.map((k) => (
                          <Table.Td key={k}>{String(game[k] || '')}</Table.Td>
                        ))}
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Paper>
          </Box>
        );
      })}
    </Box>
  );
}

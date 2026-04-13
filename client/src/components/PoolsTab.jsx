import {
  SimpleGrid,
  Paper,
  Text,
  Title,
  Alert,
  Box,
  List,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

export default function PoolsTab({ poolsData }) {
  if (!poolsData) return null;

  if (poolsData.error) {
    return (
      <Alert
        icon={<IconAlertCircle size={16} />}
        title="Error loading pools"
        color="red"
        variant="light"
        mt="md"
      >
        {poolsData.error}
      </Alert>
    );
  }

  const pools = poolsData.pools || [];

  if (pools.length === 0) {
    return (
      <Box pt="xl" style={{ textAlign: 'center' }}>
        <Text c="dimmed" size="sm">
          Pool play draw not yet published. Check back closer to the event.
        </Text>
      </Box>
    );
  }

  return (
    <Box pt="md">
      <Title order={4} mb="md">
        Pool Play Draw
      </Title>
      <SimpleGrid cols={{ base: 1, xs: 2, md: 3 }} spacing="md">
        {pools.map((pool, i) => (
          <Paper
            key={`${pool.name}-${i}`}
            shadow="sm"
            radius="md"
            withBorder
            style={{ overflow: 'hidden' }}
          >
            <Box
              style={{
                backgroundColor: '#0f172a',
                color: 'white',
                padding: '0.6rem 1rem',
              }}
            >
              <Text fw={600} size="sm">
                {pool.name}
              </Text>
            </Box>
            <Box p="xs">
              {pool.teams && pool.teams.length > 0 ? (
                <List spacing="xs" size="sm" pl="xs">
                  {pool.teams.map((team, j) => (
                    <List.Item key={`${team}-${j}`}>{team}</List.Item>
                  ))}
                </List>
              ) : (
                <Text c="dimmed" size="sm" p="xs">
                  No teams listed yet
                </Text>
              )}
            </Box>
          </Paper>
        ))}
      </SimpleGrid>
    </Box>
  );
}

import { Group, Title, Text, Badge, Box, Container } from '@mantine/core';

export default function AppHeader({ status, fetchedAt }) {
  const badgeColor =
    status === 'live'
      ? 'green'
      : status === 'error'
        ? 'red'
        : 'gray';

  const badgeLabel =
    status === 'live'
      ? '🟢 Live'
      : status === 'error'
        ? '❌ Error'
        : '⏳ Loading…';

  const updatedText = fetchedAt
    ? `Updated: ${new Date(fetchedAt).toLocaleTimeString()}`
    : '';

  return (
    <Box
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderBottom: '3px solid #f97316',
        padding: '1rem 0',
      }}
    >
      <Container size="lg">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Group gap="md">
            <Text style={{ fontSize: '2.5rem', lineHeight: 1 }}>🏀</Text>
            <Box>
              <Title order={3} c="white" fw={700}>
                Hoop Nation Junior Showcase
              </Title>
              <Text size="sm" c="dimmed">
                Live Teams · Pool Play · Fixtures & Draw
              </Text>
            </Box>
          </Group>

          <Box style={{ textAlign: 'right' }}>
            <Badge color={badgeColor} variant="filled" size="md">
              {badgeLabel}
            </Badge>
            {updatedText && (
              <Text size="xs" c="dimmed" mt={4}>
                {updatedText}
              </Text>
            )}
          </Box>
        </Group>
      </Container>
    </Box>
  );
}

import {
  Table,
  Paper,
  Text,
  Title,
  Alert,
  Box,
  ScrollArea,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/([A-Z])/g, ' $1');
}

export default function ResultsTab({ resultsData }) {
  if (!resultsData) return null;

  if (resultsData.error) {
    return (
      <Alert
        icon={<IconAlertCircle size={16} />}
        title="Error loading results"
        color="red"
        variant="light"
        mt="md"
      >
        {resultsData.error}
      </Alert>
    );
  }

  const results = resultsData.results || [];

  if (results.length === 0) {
    return (
      <Box pt="xl" style={{ textAlign: 'center' }}>
        <Text c="dimmed" size="sm">
          No results posted yet. Check back during or after the event.
        </Text>
      </Box>
    );
  }

  const keys = Object.keys(results[0]);

  return (
    <Box pt="md">
      <Title order={4} mb="md">
        Live Results
      </Title>
      <Paper shadow="sm" radius="md" withBorder>
        <ScrollArea>
          <Table
            striped
            highlightOnHover
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
              {results.map((result, i) => (
                <Table.Tr key={i}>
                  {keys.map((k) => (
                    <Table.Td key={k}>{String(result[k] || '')}</Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Paper>
    </Box>
  );
}

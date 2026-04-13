import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AppShell,
  Container,
  Tabs,
  Button,
  Group,
  Text,
  Loader,
  Alert,
  Box,
} from '@mantine/core';
import {
  IconRefresh,
  IconClipboardList,
  IconShirt,
  IconSwimming,
  IconCalendar,
  IconTrophy,
} from '@tabler/icons-react';

import AppHeader from './components/Header';
import OverviewTab from './components/OverviewTab';
import TeamsTab from './components/TeamsTab';
import PoolsTab from './components/PoolsTab';
import FixturesTab from './components/FixturesTab';
import ResultsTab from './components/ResultsTab';

const API = {
  all: '/api/all',
  refresh: '/api/refresh',
};

const AUTO_REFRESH_MS = 5 * 60 * 1000;

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('loading');
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const timerRef = useRef(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    setStatus('loading');
    setError(null);

    try {
      const endpoint = forceRefresh ? API.refresh : API.all;
      const method = forceRefresh ? 'POST' : 'GET';
      const res = await fetch(endpoint, { method });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      // Always store the data so per-section errors render in each tab
      if (json.data) setData(json.data);

      if (json.ok) {
        setStatus('live');
      } else {
        // Partial failure: data is set but some sections may have errors
        const msg =
          json.error ||
          'Some sections could not be loaded. Check individual tabs for details.';
        setError(msg);
        setStatus(json.data ? 'live' : 'error');
      }
    } catch (err) {
      setError(err.message);
      setStatus('error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      fetchData(false);
    }, AUTO_REFRESH_MS);
    return () => clearInterval(timerRef.current);
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData(true);
  };

  const fetchedAt = data?.fetchedAt || null;

  return (
    <AppShell
      header={{ height: { base: 'auto' } }}
      padding={0}
      styles={{
        main: {
          backgroundColor: '#f8fafc',
          minHeight: '100vh',
        },
      }}
    >
      <AppShell.Header>
        <AppHeader status={status} fetchedAt={fetchedAt} />
      </AppShell.Header>

      <AppShell.Main>
        <Container size="lg" py="md">
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Group justify="space-between" mb="md" wrap="wrap" gap="sm">
              <Tabs.List>
                <Tabs.Tab
                  value="overview"
                  leftSection={<IconClipboardList size={16} />}
                >
                  Overview
                </Tabs.Tab>
                <Tabs.Tab
                  value="teams"
                  leftSection={<IconShirt size={16} />}
                >
                  Teams
                </Tabs.Tab>
                <Tabs.Tab
                  value="pools"
                  leftSection={<IconSwimming size={16} />}
                >
                  Pool Play
                </Tabs.Tab>
                <Tabs.Tab
                  value="fixtures"
                  leftSection={<IconCalendar size={16} />}
                >
                  Fixtures
                </Tabs.Tab>
                <Tabs.Tab
                  value="results"
                  leftSection={<IconTrophy size={16} />}
                >
                  Results
                </Tabs.Tab>
              </Tabs.List>

              <Button
                leftSection={
                  refreshing ? (
                    <Loader size={14} color="white" />
                  ) : (
                    <IconRefresh size={16} />
                  )
                }
                onClick={handleRefresh}
                disabled={refreshing}
                variant="filled"
                size="sm"
              >
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </Button>
            </Group>

            {loading && !data ? (
              <Box
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '4rem 1rem',
                }}
              >
                <Loader size="lg" color="orange" />
                <Text c="dimmed">
                  Fetching live data from hoopnation.basketball…
                </Text>
              </Box>
            ) : error && !data ? (
              <Alert
                title="Failed to load data"
                color="red"
                variant="light"
                mt="md"
              >
                Could not reach hoopnation.basketball: {error}. The app will
                retry in 5 minutes.
              </Alert>
            ) : (
              <>
                <Tabs.Panel value="overview">
                  <OverviewTab data={data} />
                </Tabs.Panel>

                <Tabs.Panel value="teams">
                  <TeamsTab teamsData={data?.teams} />
                </Tabs.Panel>

                <Tabs.Panel value="pools">
                  <PoolsTab poolsData={data?.pools} />
                </Tabs.Panel>

                <Tabs.Panel value="fixtures">
                  <FixturesTab fixturesData={data?.fixtures} />
                </Tabs.Panel>

                <Tabs.Panel value="results">
                  <ResultsTab resultsData={data?.results} />
                </Tabs.Panel>
              </>
            )}
          </Tabs>
        </Container>

        {/* Footer */}
        <Box
          component="footer"
          style={{
            backgroundColor: '#0f172a',
            color: '#94a3b8',
            textAlign: 'center',
            padding: '1rem',
            marginTop: '2rem',
          }}
        >
          <Text size="xs">
            Data sourced live from{' '}
            <Text
              component="a"
              href="https://www.hoopnation.basketball/tournaments/junior-showcase"
              target="_blank"
              rel="noopener"
              c="orange"
              size="xs"
              inherit
            >
              hoopnation.basketball
            </Text>{' '}
            · Auto-refreshes every 5 minutes
          </Text>
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}

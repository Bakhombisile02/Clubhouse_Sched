/* ── Hoop Nation Junior Showcase – Frontend app ─────────────────────────── */
'use strict';

const API = {
  all:      '/api/all',
  teams:    '/api/teams',
  pools:    '/api/pools',
  fixtures: '/api/fixtures',
  results:  '/api/results',
  refresh:  '/api/refresh',
};

const AUTO_REFRESH_MS = 5 * 60 * 1000; // 5 minutes

/* ── State ─────────────────────────────────────────────────────────────── */
let appData = null;
let refreshTimer = null;

/* ── DOM helpers ───────────────────────────────────────────────────────── */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const el = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
};

/* ── Tab navigation ─────────────────────────────────────────────────────── */
function initTabs() {
  $$('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.tab-btn').forEach(b => b.classList.remove('active'));
      $$('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = $(`#tab-${btn.dataset.tab}`);
      if (panel) panel.classList.add('active');
    });
  });
}

/* ── Fetch & render ─────────────────────────────────────────────────────── */
async function loadData(forceRefresh = false) {
  setLiveBadge('loading', '⏳ Loading…');
  setRefreshBtn(true);

  try {
    const endpoint = forceRefresh ? API.refresh : API.all;
    const method   = forceRefresh ? 'POST' : 'GET';
    const res = await fetch(endpoint, { method });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Unknown error');

    appData = json.data;
    renderAll(appData);
    setLiveBadge('live', '🟢 Live');
    setLastUpdated(appData.fetchedAt || new Date().toISOString());
  } catch (err) {
    console.error('Failed to load data:', err);
    setLiveBadge('error', '❌ Error');
    showOverviewError(
      `Could not reach hoopnation.basketball: ${err.message}. ` +
      `The app will retry in 5 minutes. Make sure the server can access the internet.`
    );
  } finally {
    setRefreshBtn(false);
  }
}

function setLiveBadge(type, text) {
  const badge = $('#liveBadge');
  if (!badge) return;
  badge.className = `badge badge-${type}`;
  badge.textContent = text;
}

function setLastUpdated(iso) {
  const el = $('#lastUpdated');
  if (!el) return;
  const d = new Date(iso);
  el.textContent = `Updated: ${d.toLocaleTimeString()}`;
}

function setRefreshBtn(loading) {
  const btn = $('#refreshBtn');
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? '⏳ Refreshing…' : '🔄 Refresh';
}

function showOverviewError(msg) {
  const errEl = $('#overviewError');
  if (!errEl) return;
  errEl.style.display = 'block';
  errEl.textContent = `⚠️  ${msg}`;
}

/* ── Render all sections ─────────────────────────────────────────────────── */
function renderAll(data) {
  $('#overviewError') && ($('#overviewError').style.display = 'none');

  renderOverview(data);
  renderTeams(data.teams);
  renderPools(data.pools);
  renderFixtures(data.fixtures);
  renderResults(data.results);
}

/* ── Overview ─────────────────────────────────────────────────────────────── */
function renderOverview(data) {
  const card = $('#eventInfoCard');
  if (!card) return;

  const info = data.pools?.eventInfo || {};
  const title = info.title || 'Hoop Nation Junior Showcase';
  const dates = info.dates || '15–18 April 2026';
  const location = info.location || 'Whanganui, NZ';

  card.innerHTML = `
    <h2>${escHtml(title)}</h2>
    <div class="meta">
      <span>📅 ${escHtml(dates)}</span>
      <span>📍 ${escHtml(location)}</span>
      <span>
        <a href="https://www.hoopnation.basketball/tournaments/junior-showcase"
           target="_blank" rel="noopener">🌐 Official site</a>
      </span>
    </div>
  `;

  const teamCount    = (data.teams?.teams || []).length;
  const poolCount    = (data.pools?.pools || []).length;
  const fixtureCount = (data.fixtures?.fixtures || []).length;
  const resultCount  = (data.results?.results || []).length;

  $('#statTeams').textContent    = teamCount;
  $('#statPools').textContent    = poolCount;
  $('#statFixtures').textContent = fixtureCount;
  $('#statResults').textContent  = resultCount;

  const statsGrid = $('#statsGrid');
  if (statsGrid) statsGrid.style.display = '';
}

/* ── Teams ─────────────────────────────────────────────────────────────────── */
function renderTeams(teamsData) {
  const container = $('#teamsContent');
  if (!container) return;

  const teams = teamsData?.teams || [];
  if (teamsData?.error) {
    container.innerHTML = `<div class="error-banner">⚠️ ${escHtml(teamsData.error)}</div>`;
    return;
  }
  if (teams.length === 0) {
    container.innerHTML = '<div class="empty-state">No team data available yet. Check back closer to the event.</div>';
    return;
  }

  const grid = el('div', 'teams-grid');
  teams.forEach(team => {
    const card = el('div', 'team-card');
    card.innerHTML = `
      <div class="team-name">${escHtml(team.name)}</div>
      <div class="team-meta">
        ${team.division ? `🏅 ${escHtml(team.division)}` : ''}
        ${team.pool ? ` · Pool ${escHtml(team.pool)}` : ''}
      </div>
    `;
    grid.appendChild(card);
  });

  container.innerHTML = '';
  container.appendChild(grid);

  // Wire up search
  const searchInput = $('#teamSearch');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase();
      $$('.team-card', container).forEach(card => {
        card.style.display = card.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }
}

/* ── Pools ─────────────────────────────────────────────────────────────────── */
function renderPools(poolsData) {
  const container = $('#poolsContent');
  if (!container) return;

  const pools = poolsData?.pools || [];
  if (poolsData?.error) {
    container.innerHTML = `<div class="error-banner">⚠️ ${escHtml(poolsData.error)}</div>`;
    return;
  }
  if (pools.length === 0) {
    container.innerHTML = '<div class="empty-state">Pool play draw not yet published. Check back closer to the event.</div>';
    return;
  }

  const grid = el('div', 'pools-grid');
  pools.forEach(pool => {
    const card = el('div', 'pool-card');
    const teamRows = (pool.teams || []).map(t => `<li>${escHtml(t)}</li>`).join('');
    card.innerHTML = `
      <div class="pool-header">${escHtml(pool.name)}</div>
      <ul class="pool-teams">${teamRows || '<li style="padding:.5rem 1rem;color:#94a3b8">No teams listed yet</li>'}</ul>
    `;
    grid.appendChild(card);
  });

  container.innerHTML = '';
  container.appendChild(grid);
}

/* ── Fixtures ──────────────────────────────────────────────────────────────── */
function renderFixtures(fixturesData) {
  const container = $('#fixturesContent');
  if (!container) return;

  const fixtures = fixturesData?.fixtures || [];
  if (fixturesData?.error) {
    container.innerHTML = `<div class="error-banner">⚠️ ${escHtml(fixturesData.error)}</div>`;
    return;
  }
  if (fixtures.length === 0) {
    container.innerHTML = '<div class="empty-state">Fixtures not yet published. Check back closer to the event.</div>';
    return;
  }

  // Group by venue
  const byVenue = {};
  fixtures.forEach(f => {
    const venue = f.venue || 'Unknown Venue';
    if (!byVenue[venue]) byVenue[venue] = [];
    byVenue[venue].push(f);
  });

  const wrapper = el('div', 'fixtures-wrapper');
  Object.entries(byVenue).forEach(([venue, games]) => {
    const section = document.createElement('div');
    section.style.marginBottom = '1.5rem';

    // Headers from first fixture's keys (exclude 'venue')
    const keys = Object.keys(games[0]).filter(k => k !== 'venue');

    const rows = games.map(g =>
      `<tr>${keys.map(k => `<td>${escHtml(String(g[k] || ''))}</td>`).join('')}</tr>`
    ).join('');

    section.innerHTML = `
      <div class="venue-label">📍 ${escHtml(venue)}</div>
      <table class="data-table">
        <thead>
          <tr>${keys.map(k => `<th>${escHtml(capitalise(k))}</th>`).join('')}</tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
    wrapper.appendChild(section);
  });

  container.innerHTML = '';
  container.appendChild(wrapper);

  // Search
  const searchInput = $('#fixtureSearch');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase();
      $$('tbody tr', container).forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }
}

/* ── Results ───────────────────────────────────────────────────────────────── */
function renderResults(resultsData) {
  const container = $('#resultsContent');
  if (!container) return;

  const results = resultsData?.results || [];
  if (resultsData?.error) {
    container.innerHTML = `<div class="error-banner">⚠️ ${escHtml(resultsData.error)}</div>`;
    return;
  }
  if (results.length === 0) {
    container.innerHTML = '<div class="empty-state">No results posted yet. Check back during or after the event.</div>';
    return;
  }

  const keys = Object.keys(results[0]);
  const rows = results.map(r =>
    `<tr>${keys.map(k => `<td>${escHtml(String(r[k] || ''))}</td>`).join('')}</tr>`
  ).join('');

  container.innerHTML = `
    <div class="fixtures-wrapper">
      <table class="data-table">
        <thead>
          <tr>${keys.map(k => `<th>${escHtml(capitalise(k))}</th>`).join('')}</tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

/* ── Utilities ──────────────────────────────────────────────────────────────── */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/([A-Z])/g, ' $1');
}

/* ── Auto-refresh ───────────────────────────────────────────────────────────── */
function scheduleRefresh() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(async () => {
    await loadData(false);
    scheduleRefresh();
  }, AUTO_REFRESH_MS);
}

/* ── Boot ───────────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initTabs();

  $('#refreshBtn').addEventListener('click', () => {
    loadData(true).then(scheduleRefresh);
  });

  loadData(false).then(scheduleRefresh);
});

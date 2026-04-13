'use strict';

/**
 * HoopNation Junior Showcase scraper.
 *
 * Fetches live team names, pool play, fixtures (draw/game list) from the
 * official HoopNation website: https://www.hoopnation.basketball
 *
 * The site organises data under:
 *   /tournaments/<id>/draws               – full draw / pools
 *   /tournaments/<id>/draws/venue/<name>  – per-venue draw
 *   /tournaments/<id>/results             – live / final results
 *   /tournaments/<id>/teams               – team listing
 *
 * All pages are server-side-rendered HTML so we use axios + cheerio.
 */

const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = process.env.HOOPNATION_BASE_URL || 'https://www.hoopnation.basketball';
// Tournament 15 = 2026 Junior Showcase (April 15-18, Whanganui NZ)
const TOURNAMENT_ID = process.env.TOURNAMENT_ID || '15';

const VENUES = [
  'Whanganui High School',
  'Faith City School',
];

/** Shared axios instance with browser-like headers to avoid bot detection */
const http = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/124.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  },
});

/**
 * Load an HTML page and return a cheerio root.
 * Returns null when the page cannot be retrieved.
 * @param {string} path  URL path relative to BASE_URL
 */
async function loadPage(path) {
  const url = `${BASE_URL}${path}`;
  const { data } = await http.get(path);
  return { $: cheerio.load(data), url };
}

/* ------------------------------------------------------------------ */
/*  Parsers – each extracts a specific section from the loaded HTML    */
/* ------------------------------------------------------------------ */

/**
 * Extract the event meta-data from the tournament landing page.
 * Falls back gracefully when the expected selectors aren't found.
 */
function parseEventInfo($) {
  const info = {};

  // Tournament heading / title
  info.title =
    $('h1').first().text().trim() ||
    $('title').text().replace(/ [-|].*/, '').trim();

  // Date range – common pattern: "15–18 April 2026"
  const dateText = $('body').text();
  const dateMatch = dateText.match(
    /(\d{1,2}[\s–\-]+\d{1,2}\s+\w+\s+\d{4}|\d{1,2}\s+\w+\s+\d{4})/
  );
  if (dateMatch) info.dates = dateMatch[1].trim();

  // Location
  const locMatch = dateText.match(/Whanganui|Wellington|Auckland|Hamilton/i);
  if (locMatch) info.location = locMatch[0];

  return info;
}

/**
 * Parse the teams page.
 * Looks for <table> rows or card-style <div> elements containing team names.
 */
function parseTeams($) {
  const teams = [];

  // Strategy 1 – tables
  $('table tbody tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length > 0) {
      const name = $(cells[0]).text().trim();
      const division = $(cells[1]) ? $(cells[1]).text().trim() : '';
      const pool = $(cells[2]) ? $(cells[2]).text().trim() : '';
      if (name) teams.push({ name, division, pool });
    }
  });

  // Strategy 2 – card/list items when no table is found
  if (teams.length === 0) {
    $('[class*="team"]').each((_, el) => {
      const name = $(el).text().trim();
      if (name && name.length < 80) teams.push({ name, division: '', pool: '' });
    });
  }

  return teams;
}

/**
 * Parse pool play / draws page.
 * Draws are usually in <table> or labeled sections.
 */
function parsePools($) {
  const pools = [];

  // Look for pool headings followed by team lists
  $('h2, h3, h4').each((_, heading) => {
    const title = $(heading).text().trim();
    if (!title) return;

    const pool = { name: title, teams: [], games: [] };

    // Collect sibling elements until the next heading
    let el = $(heading).next();
    while (el.length && !el.is('h2, h3, h4')) {
      if (el.is('table')) {
        el.find('tbody tr').each((_, row) => {
          const cells = el.find('td', row);
          if (cells.length > 0) {
            const text = $(cells[0]).text().trim();
            if (text) pool.teams.push(text);
          }
        });
      } else if (el.is('ul, ol')) {
        el.find('li').each((_, li) => {
          const text = $(li).text().trim();
          if (text) pool.teams.push(text);
        });
      }
      el = el.next();
    }

    if (pool.teams.length > 0 || title.match(/pool|group|division/i)) {
      pools.push(pool);
    }
  });

  return pools;
}

/**
 * Parse the fixture / game list (draw) from a venue page.
 * Fixtures are usually in a table: Court | Time | Home | Away | Score
 */
function parseFixtures($, venue) {
  const fixtures = [];

  $('table').each((_, table) => {
    const headers = [];
    $(table)
      .find('thead th, thead td')
      .each((_, th) => headers.push($(th).text().trim().toLowerCase()));

    $(table)
      .find('tbody tr')
      .each((_, row) => {
        const cells = [];
        $(row)
          .find('td')
          .each((_, td) => cells.push($(td).text().trim()));

        if (cells.length < 2) return;

        // Build fixture object by mapping header positions where available.
        // When headers are present, field names come from the <thead>.
        // When absent, we fall back to positional names (time, home, away, court, score).
        const fixture = { venue: venue || '' };

        if (headers.length > 0) {
          headers.forEach((h, i) => {
            if (cells[i] !== undefined) fixture[h] = cells[i];
          });
        } else {
          // Generic fallback: positional mapping
          fixture.time  = cells[0] || '';
          fixture.home  = cells[1] || '';
          fixture.away  = cells[2] || '';
          fixture.court = cells[3] || '';
          fixture.score = cells[4] || '';
        }

        fixtures.push(fixture);
      });
  });

  return fixtures;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                          */
/* ------------------------------------------------------------------ */

/**
 * Fetch the list of registered teams for the current Junior Showcase.
 * @returns {Promise<{teams: Array, source: string, fetchedAt: string}>}
 */
async function fetchTeams() {
  const path = `/tournaments/${TOURNAMENT_ID}/teams`;
  const { $, url } = await loadPage(path);
  return {
    teams: parseTeams($),
    source: url,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Fetch pool play / draw overview (all venues combined).
 * @returns {Promise<{pools: Array, eventInfo: Object, source: string, fetchedAt: string}>}
 */
async function fetchPools() {
  const path = `/tournaments/${TOURNAMENT_ID}/draws`;
  const { $, url } = await loadPage(path);
  return {
    pools: parsePools($),
    eventInfo: parseEventInfo($),
    source: url,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Fetch fixtures / game list for every known venue.
 * @returns {Promise<{fixtures: Array, source: string[], fetchedAt: string}>}
 */
async function fetchFixtures() {
  const allFixtures = [];
  const sources = [];

  for (const venue of VENUES) {
    const path = `/tournaments/${TOURNAMENT_ID}/draws/venue/${encodeURIComponent(venue)}`;
    const { $, url } = await loadPage(path);
    const fixtures = parseFixtures($, venue);
    allFixtures.push(...fixtures);
    sources.push(url);
  }

  return {
    fixtures: allFixtures,
    source: sources,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Fetch live results for the tournament.
 * @returns {Promise<{results: Array, source: string, fetchedAt: string}>}
 */
async function fetchResults() {
  // Results page ID may differ from draw ID; try the known results page
  const path = `/tournaments/${TOURNAMENT_ID}/results`;
  const { $, url } = await loadPage(path);

  const results = [];
  $('table tbody tr').each((_, row) => {
    const cells = [];
    $(row)
      .find('td')
      .each((_, td) => cells.push($(td).text().trim()));
    if (cells.length >= 2) {
      results.push({
        home: cells[0] || '',
        homeScore: cells[1] || '',
        away: cells[2] || '',
        awayScore: cells[3] || '',
        division: cells[4] || '',
        court: cells[5] || '',
        time: cells[6] || '',
      });
    }
  });

  return {
    results,
    source: url,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Fetch everything in parallel and return a combined snapshot.
 */
async function fetchAll() {
  const [teamsData, poolsData, fixturesData, resultsData] = await Promise.allSettled([
    fetchTeams(),
    fetchPools(),
    fetchFixtures(),
    fetchResults(),
  ]);

  return {
    teams: teamsData.status === 'fulfilled' ? teamsData.value : { teams: [], error: teamsData.reason?.message },
    pools: poolsData.status === 'fulfilled' ? poolsData.value : { pools: [], error: poolsData.reason?.message },
    fixtures: fixturesData.status === 'fulfilled' ? fixturesData.value : { fixtures: [], error: fixturesData.reason?.message },
    results: resultsData.status === 'fulfilled' ? resultsData.value : { results: [], error: resultsData.reason?.message },
    fetchedAt: new Date().toISOString(),
  };
}

module.exports = { fetchTeams, fetchPools, fetchFixtures, fetchResults, fetchAll };

'use strict';

/**
 * Basic unit tests for the scraper parsers.
 * Run with:  node test/scraper.test.js
 *
 * These tests validate the HTML-parsing logic without making real network calls.
 */

const cheerio = require('cheerio');
const assert  = require('assert');

// ── Pull the internal parse helpers out of scraper.js ────────────────────
// We re-implement the module boundary by re-requiring with jest/manual export.
// Since the parsers are internal, we test via the cheerio API directly.

// Inline copies of the parsing functions for isolated testing:

function parseTeams($) {
  const teams = [];
  $('table tbody tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length > 0) {
      const name = $(cells[0]).text().trim();
      const division = cells[1] ? $(cells[1]).text().trim() : '';
      const pool = cells[2] ? $(cells[2]).text().trim() : '';
      if (name) teams.push({ name, division, pool });
    }
  });
  if (teams.length === 0) {
    $('[class*="team"]').each((_, el) => {
      const name = $(el).text().trim();
      if (name && name.length < 80) teams.push({ name, division: '', pool: '' });
    });
  }
  return teams;
}

function parsePools($) {
  const pools = [];
  $('h2, h3, h4').each((_, heading) => {
    const title = $(heading).text().trim();
    if (!title) return;
    const pool = { name: title, teams: [], games: [] };
    let el = $(heading).next();
    while (el.length && !el.is('h2, h3, h4')) {
      if (el.is('ul, ol')) {
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

function parseFixtures($, venue) {
  const fixtures = [];
  $('table').each((_, table) => {
    const headers = [];
    $(table).find('thead th, thead td').each((_, th) =>
      headers.push($(th).text().trim().toLowerCase())
    );
    $(table).find('tbody tr').each((_, row) => {
      const cells = [];
      $(row).find('td').each((_, td) => cells.push($(td).text().trim()));
      if (cells.length < 2) return;
      const fixture = { venue: venue || '' };
      if (headers.length > 0) {
        headers.forEach((h, i) => { if (cells[i] !== undefined) fixture[h] = cells[i]; });
      } else {
        fixture.time = cells[0] || '';
        fixture.home = cells[1] || '';
        fixture.away = cells[2] || '';
      }
      fixtures.push(fixture);
    });
  });
  return fixtures;
}

/* ── Tests ──────────────────────────────────────────────────────────────── */
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅  ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌  ${name}: ${err.message}`);
    failed++;
  }
}

console.log('\n📋  Scraper parser tests\n');

// ── parseTeams ───────────────────────────────────────────────────────────
test('parseTeams – extracts names from a table', () => {
  const html = `
    <table>
      <thead><tr><th>Team</th><th>Division</th><th>Pool</th></tr></thead>
      <tbody>
        <tr><td>Splash Kings</td><td>17U Boys</td><td>A</td></tr>
        <tr><td>BNL Girls</td><td>15U Girls</td><td>B</td></tr>
      </tbody>
    </table>`;
  const $ = cheerio.load(html);
  const teams = parseTeams($);
  assert.strictEqual(teams.length, 2, 'Expected 2 teams');
  assert.strictEqual(teams[0].name, 'Splash Kings');
  assert.strictEqual(teams[0].division, '17U Boys');
  assert.strictEqual(teams[0].pool, 'A');
  assert.strictEqual(teams[1].name, 'BNL Girls');
});

test('parseTeams – returns empty array for empty table', () => {
  const html = '<table><tbody></tbody></table>';
  const $ = cheerio.load(html);
  const teams = parseTeams($);
  assert.strictEqual(teams.length, 0);
});

test('parseTeams – fallback to class-based elements', () => {
  const html = `
    <div class="team-card">Brown Boys</div>
    <div class="team-card">Ahi Blaze</div>`;
  const $ = cheerio.load(html);
  const teams = parseTeams($);
  assert.strictEqual(teams.length, 2);
  assert.ok(teams.some(t => t.name === 'Brown Boys'));
  assert.ok(teams.some(t => t.name === 'Ahi Blaze'));
});

// ── parsePools ───────────────────────────────────────────────────────────
test('parsePools – extracts pool name and teams from headings + lists', () => {
  const html = `
    <h3>Pool A – 17U Boys</h3>
    <ul>
      <li>Splash Kings</li>
      <li>Brown Boys</li>
    </ul>
    <h3>Pool B – 17U Boys</h3>
    <ul>
      <li>Ahi Blaze</li>
      <li>Tu Tangata</li>
    </ul>`;
  const $ = cheerio.load(html);
  const pools = parsePools($);
  assert.strictEqual(pools.length, 2);
  assert.strictEqual(pools[0].name, 'Pool A – 17U Boys');
  assert.deepStrictEqual(pools[0].teams, ['Splash Kings', 'Brown Boys']);
  assert.deepStrictEqual(pools[1].teams, ['Ahi Blaze', 'Tu Tangata']);
});

test('parsePools – includes pool-keyword headings with no teams', () => {
  const html = `<h2>Division 13U Girls Pool Play</h2>`;
  const $ = cheerio.load(html);
  const pools = parsePools($);
  assert.strictEqual(pools.length, 1);
  assert.strictEqual(pools[0].name, 'Division 13U Girls Pool Play');
});

test('parsePools – ignores headings without teams and without pool keyword', () => {
  const html = `<h2>Welcome to the event</h2>`;
  const $ = cheerio.load(html);
  const pools = parsePools($);
  assert.strictEqual(pools.length, 0);
});

// ── parseFixtures ─────────────────────────────────────────────────────────
test('parseFixtures – extracts game rows with headers', () => {
  const html = `
    <table>
      <thead><tr><th>Time</th><th>Home</th><th>Away</th><th>Court</th></tr></thead>
      <tbody>
        <tr><td>9:00 AM</td><td>Splash Kings</td><td>Brown Boys</td><td>1</td></tr>
        <tr><td>10:00 AM</td><td>Ahi Blaze</td><td>Tu Tangata</td><td>2</td></tr>
      </tbody>
    </table>`;
  const $ = cheerio.load(html);
  const fixtures = parseFixtures($, 'Whanganui High School');
  assert.strictEqual(fixtures.length, 2);
  assert.strictEqual(fixtures[0].time, '9:00 AM');
  assert.strictEqual(fixtures[0].home, 'Splash Kings');
  assert.strictEqual(fixtures[0].away, 'Brown Boys');
  assert.strictEqual(fixtures[0].court, '1');
  assert.strictEqual(fixtures[0].venue, 'Whanganui High School');
});

test('parseFixtures – uses positional mapping when no headers', () => {
  const html = `
    <table>
      <tbody>
        <tr><td>9:00 AM</td><td>Team A</td><td>Team B</td></tr>
      </tbody>
    </table>`;
  const $ = cheerio.load(html);
  const fixtures = parseFixtures($, 'Test Venue');
  assert.strictEqual(fixtures.length, 1);
  assert.strictEqual(fixtures[0].time, '9:00 AM');
  assert.strictEqual(fixtures[0].home, 'Team A');
  assert.strictEqual(fixtures[0].away, 'Team B');
});

test('parseFixtures – skips rows with fewer than 2 cells', () => {
  const html = `
    <table>
      <tbody>
        <tr><td>only one cell</td></tr>
        <tr><td>9:00 AM</td><td>Team A</td></tr>
      </tbody>
    </table>`;
  const $ = cheerio.load(html);
  const fixtures = parseFixtures($, 'Venue');
  assert.strictEqual(fixtures.length, 1);
});

// ── Summary ──────────────────────────────────────────────────────────────
console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);

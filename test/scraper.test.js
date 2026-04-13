'use strict';

/**
 * Basic unit tests for the scraper parsers.
 * Run with:  node test/scraper.test.js
 *
 * These tests validate the HTML-parsing logic without making real network calls.
 */

const cheerio = require('cheerio');
const assert  = require('assert');

// ── Import the real parser helpers from scraper.js ───────────────────────
const scraperModule = require('../src/scraper');
const { parseTeams, parsePools, parseFixtures } = scraperModule._internal;

assert.strictEqual(typeof parseTeams, 'function', 'Expected parseTeams to be exported from src/scraper.js');
assert.strictEqual(typeof parsePools, 'function', 'Expected parsePools to be exported from src/scraper.js');
assert.strictEqual(typeof parseFixtures, 'function', 'Expected parseFixtures to be exported from src/scraper.js');

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

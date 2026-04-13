'use strict';

/**
 * Express router providing the REST API used by the frontend.
 *
 * GET /api/all        – teams + pools + fixtures + results in one request
 * GET /api/teams      – registered team listing
 * GET /api/pools      – pool play / draw overview
 * GET /api/fixtures   – game list per venue
 * GET /api/results    – live / final results
 * POST /api/refresh   – bust cache and return fresh data
 */

const { Router } = require('express');
const scraper = require('./scraper');
const { getOrFetch, invalidate, KEYS } = require('./cache');

const router = Router();

/* Wrap async route handlers to forward errors to Express error handler. */
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

router.get(
  '/all',
  wrap(async (_req, res) => {
    const data = await getOrFetch(KEYS.ALL, scraper.fetchAll);
    res.json({ ok: true, data });
  })
);

router.get(
  '/teams',
  wrap(async (_req, res) => {
    try {
      const data = await getOrFetch(KEYS.TEAMS, scraper.fetchTeams);
      res.json({ ok: true, data });
    } catch (err) {
      res.json({ ok: false, error: err.message, data: { teams: [], fetchedAt: new Date().toISOString() } });
    }
  })
);

router.get(
  '/pools',
  wrap(async (_req, res) => {
    try {
      const data = await getOrFetch(KEYS.POOLS, scraper.fetchPools);
      res.json({ ok: true, data });
    } catch (err) {
      res.json({ ok: false, error: err.message, data: { pools: [], fetchedAt: new Date().toISOString() } });
    }
  })
);

router.get(
  '/fixtures',
  wrap(async (_req, res) => {
    try {
      const data = await getOrFetch(KEYS.FIXTURES, scraper.fetchFixtures);
      res.json({ ok: true, data });
    } catch (err) {
      res.json({ ok: false, error: err.message, data: { fixtures: [], fetchedAt: new Date().toISOString() } });
    }
  })
);

router.get(
  '/results',
  wrap(async (_req, res) => {
    try {
      const data = await getOrFetch(KEYS.RESULTS, scraper.fetchResults);
      res.json({ ok: true, data });
    } catch (err) {
      res.json({ ok: false, error: err.message, data: { results: [], fetchedAt: new Date().toISOString() } });
    }
  })
);

router.post(
  '/refresh',
  wrap(async (_req, res) => {
    invalidate();
    const data = await getOrFetch(KEYS.ALL, scraper.fetchAll);
    res.json({ ok: true, message: 'Cache cleared and data refreshed.', data });
  })
);

module.exports = router;

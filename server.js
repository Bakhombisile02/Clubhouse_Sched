'use strict';

require('dotenv').config();

const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');
const apiRouter = require('./src/routes');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// ── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 60 * 1000,   // 1-minute window
  max: 60,               // max 60 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many requests. Please try again in a minute.' },
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use('/api', limiter);
app.use(express.static(path.join(__dirname, 'public')));

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ── SPA catch-all: serve index.html for every non-API path ───────────────────
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  console.error('[ERROR]', message);
  res.status(status).json({ ok: false, error: message });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🏀  Hoop Nation Junior Showcase app running on http://localhost:${PORT}`);
  console.log(`    Serving live data from https://www.hoopnation.basketball`);
});

module.exports = app; // export for testing

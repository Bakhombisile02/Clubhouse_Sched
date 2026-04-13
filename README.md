# Hoop Nation Junior Showcase – Live Draw & Fixtures

A Node.js/Express web app that pulls **live team names, pool play draws, fixtures,
and results** for the [Hoop Nation Junior Showcase](https://www.hoopnation.basketball/tournaments/junior-showcase) basketball tournament.

## Features

- 🏀 **Live team listing** – all registered teams with division and pool info
- 🏊 **Pool play draw** – pools grouped by division/gender with team lists
- 📅 **Game fixtures** – court-by-court schedules per venue
- 🏆 **Live results** – scores as they are posted
- 🔄 **Auto-refresh** every 5 minutes (configurable via `CACHE_TTL_SECONDS`)
- 📱 Responsive design – works on mobile and desktop

## Quick start

```bash
npm install
npm start          # runs on http://localhost:3000
```

Copy `.env.example` to `.env` to customise settings:

```bash
cp .env.example .env
```

| Variable             | Default                          | Description                    |
|----------------------|----------------------------------|--------------------------------|
| `PORT`               | `3000`                           | HTTP port                      |
| `CACHE_TTL_SECONDS`  | `300`                            | Cache lifetime (seconds)       |
| `HOOPNATION_BASE_URL`| `https://www.hoopnation.basketball` | Base URL of HoopNation site  |
| `TOURNAMENT_ID`      | `15`                             | Tournament ID (2026 Showcase)  |

## API endpoints

| Method | Path            | Description                              |
|--------|-----------------|------------------------------------------|
| GET    | `/api/all`      | All data in one request                  |
| GET    | `/api/teams`    | Registered team listing                  |
| GET    | `/api/pools`    | Pool play draw overview                  |
| GET    | `/api/fixtures` | Game fixtures per venue                  |
| GET    | `/api/results`  | Live/final results                       |
| POST   | `/api/refresh`  | Bust cache and return fresh data         |

## Running tests

```bash
npm test
```

## Tech stack

- **Express 5** – HTTP server
- **axios** – HTTP client for fetching HoopNation pages
- **cheerio** – HTML parsing / scraping
- **node-cache** – In-memory caching
- **dotenv** – Environment configuration

## Data source

All data is fetched live from [hoopnation.basketball](https://www.hoopnation.basketball).  
The 2026 Junior Showcase runs **15–18 April 2026** in Whanganui, New Zealand.

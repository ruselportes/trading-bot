# Trading Bot — OKX + SMC Strategy

A mobile trading bot that uses Smart Money Concepts (SMC) to analyze markets and execute trades on OKX. Built with React Native (mobile) + Node.js (backend) + Supabase (database/auth).

## Architecture

```
Render Free Web Service ($0/mo + cron-job keep-alive)
├── Node.js OKX WebSocket Manager
├── SMC Engine (Market Structure, OB, FVG, Liquidity)
├── Order Manager (Paper / Demo / Live)
└── Express REST API

Supabase Free ($0/mo)
├── PostgreSQL (users, trades, settings, logs)
├── Auth (user accounts)
└── Realtime (push to mobile)

Mobile App (React Native / Expo)
├── Dashboard, Chart, Positions, Performance, Settings
└── Mode toggle: Paper | Demo | Live
```

## Trading Modes

| Mode | Market Data | Order Execution | API Keys Needed |
|---|---|---|---|
| **Paper** | Synthetic candles (generated) | Simulated fills | None |
| **Demo** | Real OKX prices (public WebSocket) | Simulated fills | None |
| **Live** | Real OKX prices | Real orders on OKX | Yes (see below) |

Hot-swap between modes at any time from the mobile app — no restart needed.

## SMC Strategy Components

- **Market Structure** — Swing highs/lows, Break of Structure (BOS), Change of Character (CHOCH)
- **Order Blocks** — Demand and supply zones detection
- **Fair Value Gaps (FVG)** — Inefficient price areas between candles
- **Liquidity Zones** — Above swing highs / below swing lows
- **Entry Logic** — Wait for structure break → retest of OB or FVG → enter → SL beyond swing point

**Timeframes**: 15m / 1h / 4h (configurable pairs)

## Getting Started

### 1. Backend

```bash
# Install dependencies (shared + backend)
npm install

# Build shared types
npm run build -w packages/shared

# Build backend
npm run build -w packages/backend

# Start (default: demo mode)
npm run dev -w packages/backend
```

### 2. Environment Variables

Copy `packages/backend/.env.example` to `.env` and fill in:

```
TRADING_MODE=demo              # paper | demo | live
SUPABASE_URL=                  # optional for now
SUPABASE_SERVICE_KEY=          # optional for now

# Only needed for LIVE mode:
OKX_API_KEY=
OKX_SECRET=
OKX_PASSPHRASE=
```

### 3. Mobile App

```bash
cd packages/mobile
npm install
npx expo start
```

Set `EXPO_PUBLIC_API_URL` in `packages/mobile/.env` to your backend URL.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check (used by cron-job keep-alive) |
| GET | `/api/v1/status` | Bot status, mode, active trades |
| POST | `/api/v1/mode` | Switch modes: `{"mode": "paper"}` |
| GET | `/api/v1/analysis?pair=BTC-USDT&timeframe=1h` | SMC analysis results |
| GET | `/api/v1/positions` | Active positions |

## Deployment (Free)

1. **Supabase** — Create free project at [supabase.com](https://supabase.com), run the migration in `supabase/migrations/001_initial_schema.sql`
2. **Render** — Deploy via Dockerfile at [render.com](https://render.com) (free tier)
3. **Keep alive** — Set up a cron job at [cron-job.org](https://cron-job.org) to ping `/health` every 5 min

## Project Structure

```
packages/
├── shared/          # Types & constants shared between backend and mobile
│   └── src/types/
├── backend/         # Node.js server
│   └── src/
│       ├── lib/          # Supabase client, OKX auth signing
│       ├── services/
│       │   ├── okx/      # REST + WebSocket clients
│       │   ├── smc/      # Market Structure, OB, FVG, Liquidity, Engine
│       │   └── orders/   # Order manager (paper/demo/live execution)
│       └── routes/
└── mobile/          # React Native / Expo app
    └── src/
        ├── screens/      # Login, Dashboard, Chart, Positions, Settings, Performance
        ├── store/        # Zustand stores (auth, bot)
        └── lib/          # Supabase client, API helpers
```

## Requirements

- Node.js 20+
- npm 10+
- Expo Go (for mobile testing)

## License

MIT

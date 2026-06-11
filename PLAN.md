# Trading Bot — OKX + SMC Strategy

## Architecture

```
Render Free Web Service ($0/mo + cron-job keep-alive)
├── Node.js WebSocket Manager (OKX WS)
├── SMC Engine (worker threads)
├── Order Manager
└── Express REST API

Supabase Free ($0/mo)
├── PostgreSQL (users, trades, settings, logs)
├── Auth (user accounts)
└── Realtime (push to mobile)

Mobile App (React Native / Expo)

cron-job.org (free, pings every 5 min → keeps Render service alive 24/7)
```

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native (Expo), TypeScript |
| Backend | Node.js + Express + TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime |
| Hosting (Backend) | Render Free Web Service |
| Keep-Alive | cron-job.org |
| Exchange | OKX (demo + live) |
| Strategy | SMC — Smart Money Concepts |

## SMC Strategy Components

- Market Structure (BOS, CHOCH)
- Order Blocks (demand/supply zones)
- Fair Value Gaps (FVG)
- Liquidity Zones (above highs / below lows)
- Entry on retest of OB or FVG after structure break
- SL beyond swing point, TP at next liquidity zone

## Timeframes

15m / 1h / 4h — user configurable pairs

## Demo Mode

OKX Demo Account (sandbox environment, paper USDT, real market data).
Toggle between demo / live in settings.

## Implementation Order

| # | Step | Est. Time |
|---|---|---|
| 1 | Monorepo scaffolding — packages/shared, backend, mobile | ~30 min |
| 2 | Supabase schema — tables + RLS + Auth | ~30 min |
| 3 | Backend — OKX Integration (REST + WS client) | ~1 hr |
| 4 | Backend — SMC Engine (market structure, OB, FVG, liquidity) | ~2 hr |
| 5 | Backend — Order Manager (entry rules, SL/TP, positions) | ~1 hr |
| 6 | Backend — REST API + Supabase sync | ~1 hr |
| 7 | Mobile — Core (navigation, auth, Supabase Realtime) | ~1 hr |
| 8 | Mobile — Dashboard + Chart (portfolio, candlestick + SMC overlays) | ~2 hr |
| 9 | Mobile — Trading Screens (positions, bot config, performance) | ~1.5 hr |
| 10 | Render Deployment — Dockerfile + GitHub auto-deploy + cron-job | ~30 min |
| 11 | Testing — Demo mode validation | ~30 min |

**Total: ~11 hours**

## Render Free Limitations & Workarounds

| Limit | Workaround |
|---|---|
| Spins down after 15 min idle | cron-job.org pings /health every 5 min |
| 512 MB RAM | Fine for 1-2 pairs, 3 timeframes |
| 0.1 CPU | SMC uses async + lightweight calcs |
| 100 GB bandwidth/mo | Well under limit |
| No persistent disk | Supabase for DB |
| 500 build minutes/mo | ~20 min per deploy, plenty |

## Database Tables (Supabase)

- **users** — id, email, created_at
- **api_keys** — id, user_id, mode (demo/live), api_key, secret (encrypted), passphrase (encrypted)
- **settings** — id, user_id, pairs, timeframes, risk_per_trade, max_trades, mode
- **trades** — id, user_id, pair, side, entry_price, size, sl, tp, status, pnl, opened_at, closed_at
- **performance_logs** — id, user_id, date, win_rate, profit_factor, total_trades, equity

## Safety Features

- Mode cannot switch to "live" without confirmation + re-entering live keys
- Clear mode indicator on every screen: 🔴 LIVE / 🟡 DEMO / 🟢 PAPER
- Demo balance check before every trade

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { DEFAULT_PAIRS, DEFAULT_TIMEFRAMES } from '@trading-bot/shared'
import type { BotSettings, TradingMode } from '@trading-bot/shared'
import { OKXWebSocketManager } from './services/okx/websocket'
import { OKXRestClient } from './services/okx/rest'
import { SMCEngine } from './services/smc/engine'
import type { SMCAnalysisResult } from './services/smc/engine'
import { OrderManager } from './services/orders/manager'
import routes from './routes'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())
app.use('/api', routes)

// --- Core services (shared across all modes) ---
const smcEngine = new SMCEngine()
const orderManager = new OrderManager('demo')

// --- Mode-dependent services ---
let currentMode: TradingMode = 'demo'
let wsManager: OKXWebSocketManager | null = null
let restClient: OKXRestClient | null = null
let paperInterval: NodeJS.Timeout | null = null

const lastSignals = new Map<string, number>()

const settings: BotSettings = {
  pairs: DEFAULT_PAIRS,
  timeframes: DEFAULT_TIMEFRAMES,
  riskPerTrade: 1.0,
  maxTrades: 3,
  mode: currentMode,
  minProfitRatio: 2.0,
  autoTrade: false,
}

// --- Helpers ---

function handleAnalysis(pair: string, timeframe: string, analysis: SMCAnalysisResult) {
  if (!analysis.signal) return

  const key = `${pair}|${timeframe}|${analysis.signal.side}`
  const lastTime = lastSignals.get(key) || 0
  if (Date.now() - lastTime < 60000) return
  lastSignals.set(key, Date.now())

  console.log(`[SIGNAL] ${analysis.signal.side.toUpperCase()} ${pair} ${timeframe}`)
  console.log(`  Entry: ${analysis.signal.entry}`)
  console.log(`  SL: ${analysis.signal.stopLoss} | TP: ${analysis.signal.takeProfit}`)
  console.log(`  Reason: ${analysis.signal.reason}`)

  if (settings.autoTrade) {
    orderManager.processSignal(analysis.signal, 'system')
  }
}

function onCandleCallback(pair: string, timeframe: string, candle: any) {
  smcEngine.addCandle(pair, timeframe as any, candle)
  const analysis = smcEngine.analyze(pair, timeframe as any)
  handleAnalysis(pair, timeframe, analysis)
}

function createWS(mode: TradingMode): OKXWebSocketManager {
  const ws = new OKXWebSocketManager(
    { demo: mode === 'demo' },
    { onCandle: onCandleCallback, onMessage: (ch, d) => console.log(`[WS] ${ch}:`, JSON.stringify(d).slice(0, 200)) },
  )
  ws.connect()
  ws.subscribePairs(settings.pairs, settings.timeframes)
  return ws
}

function startPaperFeed() {
  stopPaperFeed()
  console.log('[Paper] Starting synthetic data feed')
  const prices: Record<string, number> = { 'BTC-USDT': 65000, 'ETH-USDT': 3500 }
  paperInterval = setInterval(() => {
    for (const pair of settings.pairs) {
      const change = (Math.random() - 0.5) * 200
      const open = prices[pair]
      const close = open + change
      const high = Math.max(open, close) + Math.random() * 50
      const low = Math.min(open, close) - Math.random() * 50
      prices[pair] = close

      const candle = { timestamp: Date.now(), open, high, low, close, volume: Math.random() * 1000 + 100 }
      for (const tf of settings.timeframes) {
        onCandleCallback(pair, tf, candle)
      }
    }
  }, 3000)
}

function stopPaperFeed() {
  if (paperInterval) { clearInterval(paperInterval); paperInterval = null }
}

function initREST(mode: TradingMode) {
  restClient = null
  if (mode !== 'live') return

  const key = process.env.OKX_API_KEY
  const secret = process.env.OKX_SECRET
  const pass = process.env.OKX_PASSPHRASE

  if (key && secret && pass) {
    restClient = new OKXRestClient({ apiKey: key, secret, passphrase: pass, demo: false })
    orderManager.setRestClient(restClient)
    console.log('[Bot] REST client initialized for LIVE mode')
  } else {
    console.warn('[Bot] LIVE mode but OKX_API_KEY/SECRET/PASSPHRASE not set')
  }
}

async function switchMode(newMode: TradingMode): Promise<{ success: boolean; message: string }> {
  if (newMode === currentMode) return { success: true, message: `Already in ${newMode} mode` }

  // Teardown current mode
  if (wsManager) { wsManager.disconnect(); wsManager = null }
  stopPaperFeed()
  restClient = null
  orderManager.setRestClient(null)

  // Reset SMC engine for clean state
  smcEngine.reset()

  // Setup new mode
  currentMode = newMode
  settings.mode = newMode
  orderManager.setMode(newMode)

  if (newMode === 'paper') {
    startPaperFeed()
  } else {
    wsManager = createWS(newMode)
    if (newMode === 'live') {
      initREST('live')
    }
  }

  console.log(`[Bot] Switched to ${newMode.toUpperCase()} mode`)
  return { success: true, message: `Switched to ${newMode} mode` }
}

// --- REST Endpoints ---

app.get('/api/v1/status', (_req, res) => {
  res.json({
    mode: currentMode,
    pairs: settings.pairs,
    timeframes: settings.timeframes,
    activeTrades: orderManager.getActiveTrades().length,
    autoTrade: settings.autoTrade,
    uptime: process.uptime(),
  })
})

app.post('/api/v1/mode', async (req, res) => {
  const { mode } = req.body || {}
  if (!['paper', 'demo', 'live'].includes(mode)) {
    return res.status(400).json({ error: 'Invalid mode. Use: paper, demo, or live' })
  }

  if (mode === 'live') {
    const hasKeys = process.env.OKX_API_KEY && process.env.OKX_SECRET && process.env.OKX_PASSPHRASE
    if (!hasKeys) {
      return res.status(400).json({
        error: 'Cannot switch to LIVE — OKX_API_KEY, OKX_SECRET, and OKX_PASSPHRASE must be set in .env',
      })
    }
  }

  const result = await switchMode(mode as TradingMode)
  res.json(result)
})

app.get('/api/v1/analysis', (req, res) => {
  const pair = (req.query.pair as string) || 'BTC-USDT'
  const timeframe = (req.query.timeframe as string) || '1h'
  const candles = smcEngine.getCandles(pair, timeframe as any)
  const analysis = smcEngine.analyze(pair, timeframe as any)
  res.json({ pair, timeframe, candleCount: candles.length, lastCandle: candles[candles.length - 1] || null, analysis })
})

app.get('/api/v1/positions', (_req, res) => {
  res.json({ positions: orderManager.getActiveTrades() })
})

// --- Startup ---

async function startBot() {
  orderManager.setSettings(settings)
  const initialMode = (process.env.TRADING_MODE || 'demo') as TradingMode
  const result = await switchMode(initialMode)
  console.log(`[Bot] ${result.message}`)
  console.log(`[Bot] Pairs: ${settings.pairs.join(', ')} | Timeframes: ${settings.timeframes.join(', ')}`)
}

process.on('SIGTERM', () => { wsManager?.disconnect(); stopPaperFeed(); process.exit(0) })
process.on('SIGINT', () => { wsManager?.disconnect(); stopPaperFeed(); process.exit(0) })

app.listen(PORT, async () => {
  console.log(`Trading bot backend running on port ${PORT}`)
  await startBot()
})

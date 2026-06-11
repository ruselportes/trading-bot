import { create } from 'zustand'
import type { Trade, SMCSignal, BotSettings, PerformanceStats, Timeframe } from '@trading-bot/shared'

interface BotState {
  mode: 'paper' | 'demo' | 'live'
  pairs: string[]
  timeframes: Timeframe[]
  autoTrade: boolean
  activeTrades: Trade[]
  signals: SMCSignal[]
  performance: PerformanceStats | null
  setMode: (mode: 'paper' | 'demo' | 'live') => void
  setPairs: (pairs: string[]) => void
  setAutoTrade: (enabled: boolean) => void
  setActiveTrades: (trades: Trade[]) => void
  addSignal: (signal: SMCSignal) => void
  setPerformance: (stats: PerformanceStats) => void
}

export const useBotStore = create<BotState>((set) => ({
  mode: 'demo',
  pairs: ['BTC-USDT', 'ETH-USDT'],
  timeframes: ['15m', '1h', '4h'],
  autoTrade: false,
  activeTrades: [],
  signals: [],
  performance: null,

  setMode: (mode) => set({ mode }),
  setPairs: (pairs) => set({ pairs }),
  setAutoTrade: (autoTrade) => set({ autoTrade }),
  setActiveTrades: (trades) => set({ activeTrades: trades }),
  addSignal: (signal) => set((s) => ({ signals: [signal, ...s.signals].slice(0, 50) })),
  setPerformance: (stats) => set({ performance: stats }),
}))

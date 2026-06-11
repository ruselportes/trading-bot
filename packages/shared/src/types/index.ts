export type TradingMode = 'paper' | 'demo' | 'live'

export type OrderSide = 'buy' | 'sell'

export type OrderType = 'market' | 'limit'

export type PositionSide = 'long' | 'short'

export type TradeStatus = 'open' | 'closed' | 'cancelled'

export type Timeframe = '15m' | '1h' | '4h'

export interface Candle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface MarketStructure {
  timeframe: Timeframe
  swingHighs: { price: number; timestamp: number }[]
  swingLows: { price: number; timestamp: number }[]
  broken: boolean
  direction: 'bullish' | 'bearish' | 'neutral'
}

export interface OrderBlock {
  type: 'demand' | 'supply'
  top: number
  bottom: number
  timestamp: number
  mitigated: boolean
  strength: number
}

export interface FVG {
  top: number
  bottom: number
  timestamp: number
  direction: 'bullish' | 'bearish'
  mitigated: boolean
}

export interface LiquidityZone {
  type: 'buyside' | 'sellside'
  price: number
  timestamp: number
  swept: boolean
}

export interface SMCSignal {
  pair: string
  timeframe: Timeframe
  side: PositionSide
  entry: number
  stopLoss: number
  takeProfit: number
  reason: string
  timestamp: number
  orderBlock?: OrderBlock
  fvg?: FVG
  liquidity?: LiquidityZone
}

export interface Trade {
  id: string
  userId: string
  pair: string
  side: PositionSide
  entryPrice: number
  size: number
  stopLoss: number
  takeProfit: number
  status: TradeStatus
  pnl: number | null
  pnlPercent: number | null
  openedAt: string
  closedAt: string | null
  reason: string
}

export interface BotSettings {
  pairs: string[]
  timeframes: Timeframe[]
  riskPerTrade: number
  maxTrades: number
  mode: TradingMode
  minProfitRatio: number
  autoTrade: boolean
}

export interface UserApiKeys {
  demoApiKey: string
  demoSecret: string
  demoPassphrase: string
  liveApiKey: string
  liveSecret: string
  livePassphrase: string
}

export interface PerformanceStats {
  totalTrades: number
  winRate: number
  profitFactor: number
  totalPnl: number
  equity: number
  bestTrade: number
  worstTrade: number
}

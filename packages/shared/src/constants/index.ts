import type { Timeframe } from '../types'

export const OKX_WS_BASE = 'wss://ws.okx.com:8443/ws/v5/public'
export const OKX_WS_PRIVATE = 'wss://ws.okx.com:8443/ws/v5/private'
export const OKX_DEMO_WS_BASE = 'wss://ws.okx.com:8443/ws/v5/public?brokerId=9999'
export const OKX_REST_BASE = 'https://www.okx.com'
export const OKX_DEMO_REST_BASE = 'https://www.okx.com'

export const DEFAULT_PAIRS = ['BTC-USDT', 'ETH-USDT']
export const DEFAULT_TIMEFRAMES: Timeframe[] = ['15m', '1h', '4h']
export const DEFAULT_RISK_PER_TRADE = 1.0
export const DEFAULT_MAX_TRADES = 3
export const DEFAULT_MIN_PROFIT_RATIO = 2.0

export const HEALTH_ENDPOINT = '/health'
export const API_PREFIX = '/api/v1'

export const TIMEFRAME_MS: Record<Timeframe, number> = {
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
}

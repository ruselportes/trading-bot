import fetch from 'node-fetch'
import { OKX_REST_BASE } from '@trading-bot/shared'
import { signOKXRequest } from '../../lib/okx-auth'

interface OKXConfig {
  apiKey: string
  secret: string
  passphrase: string
  demo: boolean
}

export class OKXRestClient {
  private config: OKXConfig

  constructor(config: OKXConfig) {
    this.config = config
  }

  private get baseURL() {
    return OKX_REST_BASE
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const { headers } = signOKXRequest(
      this.config.apiKey,
      this.config.secret,
      this.config.passphrase,
      method,
      path,
      body ? JSON.stringify(body) : undefined,
    )

    const res = await fetch(`${this.baseURL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    const data = (await res.json()) as any

    if (!data || data.code !== '0') {
      throw new Error(`OKX API error: ${data?.msg || 'Unknown error'} (code: ${data?.code})`)
    }

    return data.data as T
  }

  async getAccountBalance(): Promise<any> {
    return this.request('GET', '/api/v5/account/balance')
  }

  async getPositions(instType = 'SWAP'): Promise<any> {
    return this.request('GET', `/api/v5/account/positions?instType=${instType}`)
  }

  async getCandles(
    instId: string,
    bar: string,
    limit = 100,
  ): Promise<any> {
    return this.request('GET', `/api/v5/market/candles?instId=${instId}&bar=${bar}&limit=${limit}`)
  }

  async placeOrder(params: {
    instId: string
    tdMode: 'isolated' | 'cross'
    side: 'buy' | 'sell'
    posSide: 'long' | 'short'
    ordType: 'market' | 'limit'
    sz: string
    px?: string
  }): Promise<any> {
    return this.request('POST', '/api/v5/trade/order', params as any)
  }

  async closePosition(instId: string, posSide: 'long' | 'short'): Promise<any> {
    return this.request('POST', '/api/v5/trade/close-position', {
      instId,
      posSide,
    } as any)
  }

  async setLeverage(
    instId: string,
    lever: string,
    mgnMode: 'isolated' | 'cross',
  ): Promise<any> {
    return this.request('POST', '/api/v5/account/set-leverage', {
      instId,
      lever,
      mgnMode,
    } as any)
  }

  async getTradeHistory(instType = 'SWAP', limit = 50): Promise<any> {
    return this.request('GET', `/api/v5/trade/fills?instType=${instType}&limit=${limit}`)
  }
}

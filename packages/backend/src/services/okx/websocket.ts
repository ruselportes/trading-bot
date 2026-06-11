import WebSocket from 'ws'
import { OKX_WS_BASE, OKX_DEMO_WS_BASE, OKX_WS_PRIVATE, TIMEFRAME_MS } from '@trading-bot/shared'
import { signOKXWSLogin } from '../../lib/okx-auth'
import type { Candle, Timeframe } from '@trading-bot/shared'

type MessageHandler = (channel: string, data: any) => void
type CandleHandler = (pair: string, timeframe: Timeframe, candle: Candle) => void

export class OKXWebSocketManager {
  private publicWS: WebSocket | null = null
  private privateWS: WebSocket | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private pingInterval: NodeJS.Timeout | null = null
  private subscribedChannels: Set<string> = new Set()
  private subscribedPairs: Set<string> = new Set()

  private config: {
    apiKey?: string
    secret?: string
    passphrase?: string
    demo: boolean
  }

  private onCandle: CandleHandler
  private onMessage: MessageHandler

  constructor(
    config: { apiKey?: string; secret?: string; passphrase?: string; demo: boolean },
    handlers: { onCandle: CandleHandler; onMessage: MessageHandler },
  ) {
    this.config = config
    this.onCandle = handlers.onCandle
    this.onMessage = handlers.onMessage
  }

  private get publicURL(): string {
    return this.config.demo ? OKX_DEMO_WS_BASE : OKX_WS_BASE
  }

  private get privateURL(): string {
    return OKX_WS_PRIVATE
  }

  connect() {
    this.connectPublic()
    if (this.config.apiKey) {
      this.connectPrivate()
    }
  }

  private connectPublic() {
    this.publicWS = new WebSocket(this.publicURL)

    this.publicWS.on('open', () => {
      console.log('[OKX WS] Public connected')
      this.subscribePending()
      this.startPing()
    })

    this.publicWS.on('message', (raw: Buffer) => {
      const msg = JSON.parse(raw.toString())
      this.handleMessage(msg)
    })

    this.publicWS.on('close', () => {
      console.log('[OKX WS] Public disconnected, reconnecting in 3s')
      this.scheduleReconnect()
    })

    this.publicWS.on('error', (err) => {
      console.error('[OKX WS] Public error:', err.message)
    })
  }

  private connectPrivate() {
    this.privateWS = new WebSocket(this.privateURL)

    this.privateWS.on('open', () => {
      console.log('[OKX WS] Private connected')
      this.login()
    })

    this.privateWS.on('message', (raw: Buffer) => {
      const msg = JSON.parse(raw.toString())
      this.handleMessage(msg)
    })

    this.privateWS.on('close', () => {
      console.log('[OKX WS] Private disconnected')
    })

    this.privateWS.on('error', (err) => {
      console.error('[OKX WS] Private error:', err.message)
    })
  }

  private login() {
    if (!this.config.apiKey || !this.config.secret || !this.config.passphrase) return

    const loginMsg = signOKXWSLogin(
      this.config.apiKey,
      this.config.secret,
      this.config.passphrase,
    )
    this.privateWS?.send(JSON.stringify(loginMsg))
  }

  private handleMessage(msg: any) {
    if (msg.event === 'login' && msg.code === '0') {
      console.log('[OKX WS] Login successful')
      return
    }

    if (msg.event === 'subscribe') {
      console.log(`[OKX WS] Subscribed to ${msg.arg?.channel}:${msg.arg?.instId}`)
      return
    }

    if (msg.arg?.channel === 'candle' && Array.isArray(msg.data)) {
      for (const d of msg.data) {
        const pair = msg.arg.instId
        const tf = this.msToTimeframe(parseInt(d[0]))
        if (!tf) continue
        this.onCandle(pair, tf, {
          timestamp: parseInt(d[0]),
          open: parseFloat(d[1]),
          high: parseFloat(d[2]),
          low: parseFloat(d[3]),
          close: parseFloat(d[4]),
          volume: parseFloat(d[5]),
        })
      }
      return
    }

    if (msg.data) {
      this.onMessage(msg.arg?.channel || 'unknown', msg.data)
    }
  }

  private msToTimeframe(ms: number): Timeframe | null {
    for (const [tf, range] of Object.entries(TIMEFRAME_MS)) {
      if (ms % range === 0 && ms.toString().length > 10) {
        return tf as Timeframe
      }
    }
    return null
  }

  subscribeCandles(pair: string, timeframe: Timeframe) {
    const channel = `candle${timeframe}`
    const key = `${channel}|${pair}`
    this.subscribedChannels.add(key)
    this.subscribedPairs.add(pair)

    if (this.publicWS?.readyState === WebSocket.OPEN) {
      this.publicWS.send(JSON.stringify({
        op: 'subscribe',
        args: [{ channel, instId: pair }],
      }))
    }
  }

  subscribePairs(pairs: string[], timeframes: Timeframe[]) {
    for (const pair of pairs) {
      for (const tf of timeframes) {
        this.subscribeCandles(pair, tf)
      }
    }
  }

  private subscribePending() {
    for (const key of this.subscribedChannels) {
      const [channel, instId] = key.split('|')
      this.publicWS?.send(JSON.stringify({
        op: 'subscribe',
        args: [{ channel, instId }],
      }))
    }
  }

  private startPing() {
    this.stopPing()
    this.pingInterval = setInterval(() => {
      this.publicWS?.send('ping')
      this.privateWS?.send('ping')
    }, 20000)
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connectPublic()
    }, 3000)
  }

  disconnect() {
    this.stopPing()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.publicWS?.close()
    this.privateWS?.close()
  }
}

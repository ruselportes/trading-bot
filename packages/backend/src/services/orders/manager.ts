import type { SMCSignal, Trade, BotSettings, TradingMode } from '@trading-bot/shared'
import { OKXRestClient } from '../okx/rest'
import { getSupabase } from '../../lib/supabase'
import { v4 as uuid } from 'uuid'

export class OrderManager {
  private rest: OKXRestClient | null = null
  private activeTrades: Map<string, Trade> = new Map()
  private settings: BotSettings | null = null
  private mode: TradingMode

  constructor(mode: TradingMode) {
    this.mode = mode
  }

  setRestClient(client: OKXRestClient | null) {
    this.rest = client
  }

  setMode(mode: TradingMode) {
    this.mode = mode
  }

  setSettings(settings: BotSettings) {
    this.settings = settings
  }

  async processSignal(signal: SMCSignal, userId: string): Promise<Trade | null> {
    if (!this.settings?.autoTrade) {
      console.log('[OrderManager] Auto-trade disabled')
      return null
    }

    if (this.activeTrades.size >= (this.settings?.maxTrades || 3)) {
      console.log('[OrderManager] Max trades reached')
      return null
    }

    const pairAlreadyTraded = Array.from(this.activeTrades.values())
      .some(t => t.pair === signal.pair)

    if (pairAlreadyTraded) {
      console.log(`[OrderManager] Already have an active trade on ${signal.pair}`)
      return null
    }

    try {
      // LIVE mode: execute real order via OKX
      if (this.mode === 'live') {
        if (!this.rest) {
          console.log('[OrderManager] LIVE mode but no REST client — configure OKX_API_KEY')
          return null
        }
        await this.rest.placeOrder({
          instId: signal.pair,
          tdMode: 'cross',
          side: signal.side === 'long' ? 'buy' : 'sell',
          posSide: signal.side,
          ordType: 'market',
          sz: this.calculatePositionSize(signal),
        })
      }

      // PAPER / DEMO: simulated fill at signal entry price
      const trade: Trade = {
        id: uuid(),
        userId,
        pair: signal.pair,
        side: signal.side,
        entryPrice: signal.entry,
        size: parseFloat(this.calculatePositionSize(signal)),
        stopLoss: signal.stopLoss,
        takeProfit: signal.takeProfit,
        status: 'open',
        pnl: null,
        pnlPercent: null,
        openedAt: new Date().toISOString(),
        closedAt: null,
        reason: signal.reason,
      }

      this.activeTrades.set(trade.id, trade)

      await this.saveTradeToDB(trade)
      await this.saveSignalToDB(signal, userId, trade.id)

      console.log(`[OrderManager] [${this.mode.toUpperCase()}] Trade opened: ${signal.side} ${signal.pair} @ ${signal.entry}`)
      return trade
    } catch (error) {
      console.error('[OrderManager] Failed to place order:', error)
      return null
    }
  }

  private calculatePositionSize(signal: SMCSignal): string {
    const risk = this.settings?.riskPerTrade || 1.0
    const accountBalance = this.mode === 'paper' ? 100000 : 1000000
    const entryPrice = signal.entry
    const stopPrice = signal.stopLoss
    const riskPercent = risk / 100
    const riskAmount = accountBalance * riskPercent
    const priceRisk = Math.abs(entryPrice - stopPrice)

    if (priceRisk === 0) return '0.001'

    const positionSize = riskAmount / priceRisk
    return Math.max(0.001, parseFloat(positionSize.toFixed(3))).toFixed(3)
  }

  async closeTrade(tradeId: string, exitPrice: number, reason: string): Promise<Trade | null> {
    const trade = this.activeTrades.get(tradeId)
    if (!trade) return null

    try {
      // LIVE mode: send close order to OKX
      if (this.mode === 'live') {
        await this.rest?.closePosition(trade.pair, trade.side)
      }

      const pnl = trade.side === 'long'
        ? (exitPrice - trade.entryPrice) * trade.size
        : (trade.entryPrice - exitPrice) * trade.size

      const pnlPercent = ((exitPrice - trade.entryPrice) / trade.entryPrice) * 100

      const closedTrade: Trade = {
        ...trade,
        status: 'closed',
        pnl,
        pnlPercent,
        closedAt: new Date().toISOString(),
      }

      this.activeTrades.delete(tradeId)

      const db = getSupabase()
      if (db) {
        await (db.from('trades') as any)
          .update({
            status: 'closed',
            pnl,
            pnl_percent: pnlPercent,
            closed_at: closedTrade.closedAt,
            exit_price: exitPrice,
            exit_reason: reason,
          })
          .eq('id', tradeId)
      }

      console.log(`[OrderManager] Trade closed: ${trade.side} ${trade.pair} PnL: ${pnl.toFixed(2)}`)
      return closedTrade
    } catch (error) {
      console.error('[OrderManager] Failed to close trade:', error)
      return null
    }
  }

  private async saveTradeToDB(trade: Trade) {
    const db = getSupabase()
    if (!db) return
    await (db.from('trades') as any).insert({
      id: trade.id,
      user_id: trade.userId,
      pair: trade.pair,
      side: trade.side,
      entry_price: trade.entryPrice,
      size: trade.size,
      stop_loss: trade.stopLoss,
      take_profit: trade.takeProfit,
      status: trade.status,
      reason: trade.reason,
      opened_at: trade.openedAt,
    })
  }

  private async saveSignalToDB(signal: SMCSignal, userId: string, tradeId: string) {
    const db = getSupabase()
    if (!db) return
    await (db.from('signals') as any).insert({
      user_id: userId,
      pair: signal.pair,
      timeframe: signal.timeframe,
      side: signal.side,
      entry_price: signal.entry,
      stop_loss: signal.stopLoss,
      take_profit: signal.takeProfit,
      reason: signal.reason,
      order_block: signal.orderBlock ? JSON.parse(JSON.stringify(signal.orderBlock)) : null,
      fvg: signal.fvg ? JSON.parse(JSON.stringify(signal.fvg)) : null,
      liquidity: signal.liquidity ? JSON.parse(JSON.stringify(signal.liquidity)) : null,
      executed: true,
      trade_id: tradeId,
    })
  }

  getActiveTrades(): Trade[] {
    return Array.from(this.activeTrades.values())
  }

  reset() {
    this.activeTrades.clear()
  }
}

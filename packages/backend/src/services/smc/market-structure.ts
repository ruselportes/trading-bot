import type { Candle, MarketStructure, Timeframe } from '@trading-bot/shared'

interface SwingPoint {
  price: number
  timestamp: number
  index: number
}

export class MarketStructureAnalyzer {
  private swingHighs: SwingPoint[] = []
  private swingLows: SwingPoint[] = []
  private currentDirection: 'bullish' | 'bearish' | 'neutral' = 'neutral'

  analyze(candles: Candle[], timeframe: Timeframe): MarketStructure {
    this.detectSwingPoints(candles)
    const broken = this.detectStructureBreak()
    this.updateDirection()

    return {
      timeframe,
      swingHighs: this.swingHighs.map(({ price, timestamp }) => ({ price, timestamp })),
      swingLows: this.swingLows.map(({ price, timestamp }) => ({ price, timestamp })),
      broken,
      direction: this.currentDirection,
    }
  }

  private detectSwingPoints(candles: Candle[]) {
    this.swingHighs = []
    this.swingLows = []

    // Need at least 5 candles to detect swing points
    if (candles.length < 5) return

    for (let i = 2; i < candles.length - 2; i++) {
      const current = candles[i]

      // Swing high: candle[i] is higher than 2 candles on each side
      if (
        current.high > candles[i - 1].high &&
        current.high > candles[i - 2].high &&
        current.high > candles[i + 1].high &&
        current.high > candles[i + 2].high
      ) {
        this.swingHighs.push({ price: current.high, timestamp: current.timestamp, index: i })
      }

      // Swing low: candle[i] is lower than 2 candles on each side
      if (
        current.low < candles[i - 1].low &&
        current.low < candles[i - 2].low &&
        current.low < candles[i + 1].low &&
        current.low < candles[i + 2].low
      ) {
        this.swingLows.push({ price: current.low, timestamp: current.timestamp, index: i })
      }
    }
  }

  private detectStructureBreak(): boolean {
    if (this.swingHighs.length < 2 && this.swingLows.length < 2) return false

    // Check for BOS (Break of Structure)
    if (this.currentDirection === 'bullish' && this.swingLows.length >= 2) {
      const lastLow = this.swingLows[this.swingLows.length - 1]
      const prevLow = this.swingLows[this.swingLows.length - 2]
      // Bearish BOS: price breaks below previous swing low
      if (lastLow.price < prevLow.price) return true
    }

    if (this.currentDirection === 'bearish' && this.swingHighs.length >= 2) {
      const lastHigh = this.swingHighs[this.swingHighs.length - 1]
      const prevHigh = this.swingHighs[this.swingHighs.length - 2]
      // Bullish BOS: price breaks above previous swing high
      if (lastHigh.price > prevHigh.price) return true
    }

    return false
  }

  private updateDirection() {
    if (this.swingHighs.length < 2 && this.swingLows.length < 2) {
      this.currentDirection = 'neutral'
      return
    }

    const lastSwingHigh = this.swingHighs[this.swingHighs.length - 1]
    const lastSwingLow = this.swingLows[this.swingLows.length - 1]

    if (!lastSwingHigh || !lastSwingLow) {
      this.currentDirection = 'neutral'
      return
    }

    if (this.swingHighs.length >= 2 && this.swingLows.length >= 2) {
      const prevSwingHigh = this.swingHighs[this.swingHighs.length - 2]
      const prevSwingLow = this.swingLows[this.swingLows.length - 2]

      // Higher highs + higher lows = bullish
      if (lastSwingHigh.price > prevSwingHigh.price && lastSwingLow.price > prevSwingLow.price) {
        this.currentDirection = 'bullish'
        return
      }

      // Lower highs + lower lows = bearish
      if (lastSwingHigh.price < prevSwingHigh.price && lastSwingLow.price < prevSwingLow.price) {
        this.currentDirection = 'bearish'
        return
      }
    }

    // Determine by most recent swing
    if (lastSwingHigh.index > lastSwingLow.index) {
      this.currentDirection = 'bearish'
    } else {
      this.currentDirection = 'bullish'
    }
  }

  reset() {
    this.swingHighs = []
    this.swingLows = []
    this.currentDirection = 'neutral'
  }
}

import type { Candle, OrderBlock } from '@trading-bot/shared'

export class OrderBlockDetector {
  detect(candles: Candle[]): OrderBlock[] {
    const blocks: OrderBlock[] = []

    if (candles.length < 4) return blocks

    for (let i = 1; i < candles.length - 2; i++) {
      const prev = candles[i - 1]
      const current = candles[i]
      const next1 = candles[i + 1]
      const next2 = candles[i + 2]

      // Bullish Order Block (Demand)
      // Bearish candle followed by 2+ bullish candles with strong momentum
      if (
        prev.close < prev.open && // bearish
        next1.close > next1.open && // bullish impulse
        next2.close > next2.open && // continued bullish
        next1.high > current.high // strong break above
      ) {
        blocks.push({
          type: 'demand',
          top: current.high,
          bottom: current.low,
          timestamp: current.timestamp,
          mitigated: false,
          strength: this.calculateStrength(current, next1, next2),
        })
      }

      // Bearish Order Block (Supply)
      // Bullish candle followed by 2+ bearish candles with strong momentum
      if (
        prev.close > prev.open && // bullish
        next1.close < next1.open && // bearish impulse
        next2.close < next2.open && // continued bearish
        next1.low < current.low // strong break below
      ) {
        blocks.push({
          type: 'supply',
          top: current.high,
          bottom: current.low,
          timestamp: current.timestamp,
          mitigated: false,
          strength: this.calculateStrength(current, next1, next2),
        })
      }
    }

    return blocks
  }

  private calculateStrength(base: Candle, next1: Candle, next2: Candle): number {
    const impulseSize = Math.abs(next1.close - next1.open) + Math.abs(next2.close - next2.open)
    const baseSize = Math.abs(base.close - base.open)

    if (baseSize === 0) return 1
    return Math.min(10, Math.round((impulseSize / baseSize) * 10) / 10)
  }

  isPriceInBlock(price: number, block: OrderBlock): boolean {
    return price <= block.top && price >= block.bottom
  }

  isPriceNearBlock(price: number, block: OrderBlock, threshold = 0.001): boolean {
    const blockRange = block.top - block.bottom
    const buffer = blockRange > 0 ? blockRange * 0.3 : block.top * threshold
    return price >= block.bottom - buffer && price <= block.top + buffer
  }
}

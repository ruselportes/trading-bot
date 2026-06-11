import type { Candle, LiquidityZone, MarketStructure } from '@trading-bot/shared'

export class LiquidityDetector {
  detect(candles: Candle[], structure: MarketStructure): LiquidityZone[] {
    const zones: LiquidityZone[] = []

    if (structure.swingHighs.length > 0) {
      const lastPeak = structure.swingHighs[structure.swingHighs.length - 1]
      zones.push({
        type: 'buyside',
        price: lastPeak.price,
        timestamp: lastPeak.timestamp,
        swept: false,
      })
    }

    if (structure.swingLows.length > 0) {
      const lastValley = structure.swingLows[structure.swingLows.length - 1]
      zones.push({
        type: 'sellside',
        price: lastValley.price,
        timestamp: lastValley.timestamp,
        swept: false,
      })
    }

    return zones
  }
}

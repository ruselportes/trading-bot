import type { Candle, FVG } from '@trading-bot/shared'

export class FVGDetector {
  detect(candles: Candle[]): FVG[] {
    const fvgs: FVG[] = []

    if (candles.length < 3) return fvgs

    for (let i = 0; i < candles.length - 2; i++) {
      const c1 = candles[i]
      const c2 = candles[i + 1]
      const c3 = candles[i + 2]

      // Bullish FVG: c3's low > c1's high (gap up)
      if (c3.low > c1.high) {
        fvgs.push({
          top: c3.low,
          bottom: c1.high,
          timestamp: c2.timestamp,
          direction: 'bullish',
          mitigated: false,
        })
      }

      // Bearish FVG: c3's high < c1's low (gap down)
      if (c3.high < c1.low) {
        fvgs.push({
          top: c1.low,
          bottom: c3.high,
          timestamp: c2.timestamp,
          direction: 'bearish',
          mitigated: false,
        })
      }
    }

    return fvgs
  }

  isPriceInFVG(price: number, fvg: FVG): boolean {
    return price <= fvg.top && price >= fvg.bottom
  }

  isPriceNearFVG(price: number, fvg: FVG, threshold = 0.001): boolean {
    const range = fvg.top - fvg.bottom
    const buffer = range > 0 ? range * 0.3 : fvg.top * threshold
    return price >= fvg.bottom - buffer && price <= fvg.top + buffer
  }
}

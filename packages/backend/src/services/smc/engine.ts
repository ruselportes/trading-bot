import type { Candle, SMCSignal, Timeframe, MarketStructure, OrderBlock, FVG, LiquidityZone } from '@trading-bot/shared'
import { MarketStructureAnalyzer } from './market-structure'
import { OrderBlockDetector } from './order-block'
import { FVGDetector } from './fvg'
import { LiquidityDetector } from './liquidity'

export interface SMCAnalysisResult {
  structure: MarketStructure
  orderBlocks: OrderBlock[]
  fvgs: FVG[]
  liquidity: LiquidityZone[]
  signal: SMCSignal | null
}

export class SMCEngine {
  private structureAnalyzer: MarketStructureAnalyzer
  private obDetector: OrderBlockDetector
  private fvgDetector: FVGDetector
  private liquidityDetector: LiquidityDetector

  private candleStore: Map<string, Candle[]> = new Map()
  private maxCandles = 200

  constructor() {
    this.structureAnalyzer = new MarketStructureAnalyzer()
    this.obDetector = new OrderBlockDetector()
    this.fvgDetector = new FVGDetector()
    this.liquidityDetector = new LiquidityDetector()
  }

  addCandle(pair: string, timeframe: Timeframe, candle: Candle) {
    const key = `${pair}|${timeframe}`
    let candles = this.candleStore.get(key) || []

    // Replace last candle if same timestamp, otherwise append
    if (candles.length > 0 && candles[candles.length - 1].timestamp === candle.timestamp) {
      candles[candles.length - 1] = candle
    } else {
      candles.push(candle)
    }

    // Keep max candles
    if (candles.length > this.maxCandles) {
      candles = candles.slice(-this.maxCandles)
    }

    this.candleStore.set(key, candles)
  }

  getCandles(pair: string, timeframe: Timeframe): Candle[] {
    return this.candleStore.get(`${pair}|${timeframe}`) || []
  }

  analyze(pair: string, timeframe: Timeframe): SMCAnalysisResult {
    const candles = this.getCandles(pair, timeframe)

    if (candles.length < 20) {
      return {
        structure: { timeframe, swingHighs: [], swingLows: [], broken: false, direction: 'neutral' },
        orderBlocks: [],
        fvgs: [],
        liquidity: [],
        signal: null,
      }
    }

    const structure = this.structureAnalyzer.analyze(candles, timeframe)
    const orderBlocks = this.obDetector.detect(candles)
    const fvgs = this.fvgDetector.detect(candles)
    const liquidity = this.liquidityDetector.detect(candles, structure)
    const signal = this.generateSignal(pair, timeframe, candles, structure, orderBlocks, fvgs, liquidity)

    return { structure, orderBlocks, fvgs, liquidity, signal }
  }

  private generateSignal(
    pair: string,
    timeframe: Timeframe,
    candles: Candle[],
    structure: MarketStructure,
    orderBlocks: OrderBlock[],
    fvgs: FVG[],
    liquidity: LiquidityZone[],
  ): SMCSignal | null {
    const latestCandle = candles[candles.length - 1]
    const currentPrice = latestCandle.close

    // Need structure break to consider entry
    if (!structure.broken) return null

    if (structure.direction === 'bearish' && orderBlocks.length > 0 && fvgs.length > 0) {
      return this.buildShortSignal(pair, timeframe, currentPrice, orderBlocks, fvgs, liquidity)
    }

    if (structure.direction === 'bullish' && orderBlocks.length > 0 && fvgs.length > 0) {
      return this.buildLongSignal(pair, timeframe, currentPrice, orderBlocks, fvgs, liquidity)
    }

    return null
  }

  private buildLongSignal(
    pair: string,
    timeframe: Timeframe,
    currentPrice: number,
    orderBlocks: OrderBlock[],
    fvgs: FVG[],
    liquidity: LiquidityZone[],
  ): SMCSignal | null {
    const demandOB = orderBlocks
      .filter(ob => ob.type === 'demand' && !ob.mitigated)
      .sort((a, b) => b.strength - a.strength)

    const bullishFVG = fvgs
      .filter(f => f.direction === 'bullish' && !f.mitigated)
      .sort((a, b) => (a.bottom - a.top) - (b.bottom - b.top))

    if (demandOB.length === 0) return null

    // Check if current price is near an order block or FVG
    const targetOB = demandOB.find(ob =>
      currentPrice <= ob.top * 1.01 && currentPrice >= ob.bottom * 0.99,
    ) || demandOB[0]

    const targetFVG = bullishFVG.find(fvg =>
      currentPrice <= fvg.top && currentPrice >= fvg.bottom,
    )

    if (!targetOB) return null

    const entryPrice = targetOB.top + (targetOB.top - targetOB.bottom) * 0.5
    const stopLoss = Math.min(targetOB.bottom, targetFVG?.bottom ?? targetOB.bottom) * 0.995
    const takeProfit = this.calculateTakeProfit(entryPrice, stopLoss, 'long', liquidity)

    return {
      pair,
      timeframe,
      side: 'long',
      entry: entryPrice,
      stopLoss,
      takeProfit,
      reason: 'Bullish structure break + demand OB retest' + (targetFVG ? ' + FVG' : ''),
      timestamp: Date.now(),
      orderBlock: targetOB,
      fvg: targetFVG || undefined,
      liquidity: liquidity.find(l => l.type === 'buyside'),
    }
  }

  private buildShortSignal(
    pair: string,
    timeframe: Timeframe,
    currentPrice: number,
    orderBlocks: OrderBlock[],
    fvgs: FVG[],
    liquidity: LiquidityZone[],
  ): SMCSignal | null {
    const supplyOB = orderBlocks
      .filter(ob => ob.type === 'supply' && !ob.mitigated)
      .sort((a, b) => b.strength - a.strength)

    const bearishFVG = fvgs
      .filter(f => f.direction === 'bearish' && !f.mitigated)
      .sort((a, b) => (a.top - a.bottom) - (b.top - b.bottom))

    if (supplyOB.length === 0) return null

    const targetOB = supplyOB.find(ob =>
      currentPrice <= ob.top * 1.01 && currentPrice >= ob.bottom * 0.99,
    ) || supplyOB[0]

    const targetFVG = bearishFVG.find(fvg =>
      currentPrice <= fvg.top && currentPrice >= fvg.bottom,
    )

    if (!targetOB) return null

    const entryPrice = targetOB.bottom - (targetOB.top - targetOB.bottom) * 0.5
    const stopLoss = Math.max(targetOB.top, targetFVG?.top ?? targetOB.top) * 1.005
    const takeProfit = this.calculateTakeProfit(entryPrice, stopLoss, 'short', liquidity)

    return {
      pair,
      timeframe,
      side: 'short',
      entry: entryPrice,
      stopLoss,
      takeProfit,
      reason: 'Bearish structure break + supply OB retest' + (targetFVG ? ' + FVG' : ''),
      timestamp: Date.now(),
      orderBlock: targetOB,
      fvg: targetFVG || undefined,
      liquidity: liquidity.find(l => l.type === 'sellside'),
    }
  }

  private calculateTakeProfit(
    entry: number,
    stopLoss: number,
    side: 'long' | 'short',
    liquidity: LiquidityZone[],
  ): number {
    const risk = Math.abs(entry - stopLoss)
    const rewardRatio = 2.0

    if (side === 'long') {
      return entry + risk * rewardRatio
    } else {
      return entry - risk * rewardRatio
    }
  }

  reset() {
    this.candleStore.clear()
    this.structureAnalyzer.reset()
  }
}

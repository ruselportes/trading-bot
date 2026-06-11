import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { api } from '../lib/api'
import type { Timeframe } from '@trading-bot/shared'

const PAIRS = ['BTC-USDT', 'ETH-USDT', 'SOL-USDT']
const TIMEFRAMES: Timeframe[] = ['15m', '1h', '4h']

export default function ChartScreen() {
  const [selectedPair, setSelectedPair] = useState('BTC-USDT')
  const [selectedTF, setSelectedTF] = useState<Timeframe>('1h')
  const [analysis, setAnalysis] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getAnalysis(selectedPair, selectedTF)
        setAnalysis(data)
      } catch {}
    }
    load()
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [selectedPair, selectedTF])

  const { structure, orderBlocks, fvgs, liquidity, signal } = analysis?.analysis || {}

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chart</Text>

      <ScrollView horizontal style={styles.pairRow} showsHorizontalScrollIndicator={false}>
        {PAIRS.map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.chip, selectedPair === p && styles.chipActive]}
            onPress={() => setSelectedPair(p)}
          >
            <Text style={[styles.chipText, selectedPair === p && styles.chipTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView horizontal style={styles.tfRow} showsHorizontalScrollIndicator={false}>
        {TIMEFRAMES.map(tf => (
          <TouchableOpacity
            key={tf}
            style={[styles.chip, selectedTF === tf && styles.chipActive]}
            onPress={() => setSelectedTF(tf)}
          >
            <Text style={[styles.chipText, selectedTF === tf && styles.chipTextActive]}>{tf}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Analysis</Text>
        {structure && (
          <View style={styles.row}>
            <Text style={styles.label}>Structure:</Text>
            <Text style={[styles.value, { color: structure.direction === 'bullish' ? '#4ade80' : '#ef4444' }]}>
              {structure.direction.toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.row}>
          <Text style={styles.label}>Order Blocks:</Text>
          <Text style={styles.value}>{orderBlocks?.length || 0}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>FVG:</Text>
          <Text style={styles.value}>{fvgs?.length || 0}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Liquidity Zones:</Text>
          <Text style={styles.value}>{liquidity?.length || 0}</Text>
        </View>
        {signal && (
          <View style={[styles.signalCard, { borderLeftColor: signal.side === 'long' ? '#4ade80' : '#ef4444' }]}>
            <Text style={styles.signalTitle}>
              {signal.side.toUpperCase()} SIGNAL
            </Text>
            <Text style={styles.signalText}>Entry: ${signal.entry.toFixed(2)}</Text>
            <Text style={styles.signalText}>SL: ${signal.stopLoss.toFixed(2)}</Text>
            <Text style={styles.signalText}>TP: ${signal.takeProfit.toFixed(2)}</Text>
            <Text style={styles.signalReason}>{signal.reason}</Text>
          </View>
        )}
      </View>

      {!analysis && (
        <Text style={styles.waiting}>Waiting for market data...</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23', padding: 16 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 16, marginTop: 50 },
  pairRow: { marginBottom: 8 },
  tfRow: { marginBottom: 16 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1a1a2e', marginRight: 8 },
  chipActive: { backgroundColor: '#4ade80' },
  chipText: { color: '#888', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#000' },
  infoCard: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: '#888', fontSize: 14 },
  value: { color: '#fff', fontSize: 14, fontWeight: '600' },
  signalCard: {
    backgroundColor: '#16213e',
    borderRadius: 8,
    borderLeftWidth: 3,
    padding: 12,
    marginTop: 12,
  },
  signalTitle: { color: '#fbbf24', fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  signalText: { color: '#ccc', fontSize: 13 },
  signalReason: { color: '#888', fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  waiting: { color: '#666', textAlign: 'center', marginTop: 40, fontSize: 14 },
})

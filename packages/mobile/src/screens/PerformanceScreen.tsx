import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useBotStore } from '../store/bot'

export default function PerformanceScreen() {
  const { performance } = useBotStore()

  const stats = performance || {
    totalTrades: 0,
    winRate: 0,
    profitFactor: 0,
    totalPnl: 0,
    equity: 0,
    bestTrade: 0,
    worstTrade: 0,
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Performance</Text>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.value}>{stats.totalTrades}</Text>
          <Text style={styles.label}>Total Trades</Text>
        </View>
        <View style={styles.card}>
          <Text style={[styles.value, stats.winRate >= 50 ? styles.green : styles.red]}>
            {stats.winRate}%
          </Text>
          <Text style={styles.label}>Win Rate</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.value}>{stats.profitFactor.toFixed(2)}</Text>
          <Text style={styles.label}>Profit Factor</Text>
        </View>
        <View style={styles.card}>
          <Text style={[styles.value, stats.totalPnl >= 0 ? styles.green : styles.red]}>
            ${stats.totalPnl.toFixed(2)}
          </Text>
          <Text style={styles.label}>Total P&L</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.value}>${stats.equity.toFixed(0)}</Text>
          <Text style={styles.label}>Equity</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.green}>${stats.bestTrade.toFixed(2)}</Text>
          <Text style={styles.label}>Best Trade</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.red}>${stats.worstTrade.toFixed(2)}</Text>
          <Text style={styles.label}>Worst Trade</Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23', padding: 16 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 16, marginTop: 50 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, width: '47%', alignItems: 'center',
  },
  value: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  label: { color: '#888', fontSize: 12, marginTop: 4 },
  green: { color: '#4ade80' },
  red: { color: '#ef4444' },
})

import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, RefreshControl, ScrollView } from 'react-native'
import { useBotStore } from '../store/bot'
import { api } from '../lib/api'

export default function DashboardScreen() {
  const { mode, activeTrades, autoTrade } = useBotStore()
  const [status, setStatus] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)

  const loadStatus = async () => {
    try {
      const s = await api.getStatus()
      setStatus(s)
    } catch {}
  }

  useEffect(() => { loadStatus() }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadStatus()
    setRefreshing(false)
  }

  const modeColors = { demo: '#fbbf24', live: '#ef4444', paper: '#4ade80' }
  const modeColor = modeColors[mode]

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <View style={[styles.badge, { backgroundColor: modeColor }]}>
          <Text style={styles.badgeText}>{mode.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{activeTrades.length}</Text>
          <Text style={styles.statLabel}>Open Trades</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{autoTrade ? 'ON' : 'OFF'}</Text>
          <Text style={styles.statLabel}>Auto Trade</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{status?.uptime ? Math.floor(status.uptime / 60) + 'm' : '--'}</Text>
          <Text style={styles.statLabel}>Uptime</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Positions</Text>
        {activeTrades.length === 0 ? (
          <Text style={styles.emptyText}>No open positions</Text>
        ) : (
          activeTrades.map((t) => (
            <View key={t.id} style={styles.tradeCard}>
              <View style={styles.tradeHeader}>
                <Text style={styles.pair}>{t.pair}</Text>
                <Text style={[styles.side, { color: t.side === 'long' ? '#4ade80' : '#ef4444' }]}>
                  {t.side.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.tradeDetail}>Entry: ${t.entryPrice}</Text>
              <Text style={styles.tradeDetail}>Size: {t.size}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#000', fontWeight: 'bold', fontSize: 12 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  statCard: { flex: 1, backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: '#888', fontSize: 12, marginTop: 4 },
  section: { padding: 20 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 20 },
  tradeCard: { backgroundColor: '#1a1a2e', borderRadius: 8, padding: 14, marginBottom: 8 },
  tradeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  pair: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  side: { fontWeight: 'bold', fontSize: 14 },
  tradeDetail: { color: '#aaa', fontSize: 13 },
})

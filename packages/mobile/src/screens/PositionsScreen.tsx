import React from 'react'
import { View, Text, StyleSheet, FlatList } from 'react-native'
import { useBotStore } from '../store/bot'

export default function PositionsScreen() {
  const { activeTrades } = useBotStore()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Positions</Text>

      <FlatList
        data={activeTrades}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No open positions</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.pair}>{item.pair}</Text>
              <Text style={[styles.side, { color: item.side === 'long' ? '#4ade80' : '#ef4444' }]}>
                {item.side.toUpperCase()}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Entry</Text>
              <Text style={styles.value}>${item.entryPrice}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Size</Text>
              <Text style={styles.value}>{item.size}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>SL</Text>
              <Text style={[styles.value, { color: '#ef4444' }]}>${item.stopLoss}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>TP</Text>
              <Text style={[styles.value, { color: '#4ade80' }]}>${item.takeProfit}</Text>
            </View>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23', padding: 16 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 16, marginTop: 50 },
  empty: { color: '#666', textAlign: 'center', marginTop: 60, fontSize: 16 },
  card: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  pair: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  side: { fontSize: 14, fontWeight: 'bold' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: '#888', fontSize: 14 },
  value: { color: '#fff', fontSize: 14, fontWeight: '600' },
})

import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native'
import { useBotStore } from '../store/bot'
import { useAuthStore } from '../store/auth'
import { api } from '../lib/api'
import type { TradingMode } from '@trading-bot/shared'

const MODES: { label: string; value: TradingMode }[] = [
  { label: 'Paper', value: 'paper' },
  { label: 'Demo', value: 'demo' },
  { label: 'Live', value: 'live' },
]

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001'

export default function SettingsScreen() {
  const { mode, setMode, autoTrade, setAutoTrade } = useBotStore()
  const { signOut } = useAuthStore()
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    api.getStatus().then(s => {
      setMode(s.mode)
      setAutoTrade(s.autoTrade)
    }).catch(() => {})
  }, [])

  const handleModeChange = async (newMode: TradingMode) => {
    if (newMode === mode) return

    if (newMode === 'live') {
      Alert.alert(
        'Switch to Live?',
        'This will execute real trades with real money. Make sure your live API keys are configured.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Switch',
            style: 'destructive',
            onPress: async () => {
              setSwitching(true)
              try {
                const res = await fetch(`${API_BASE}/api/v1/mode`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ mode: 'live' }),
                })
                const data = await res.json()
                if (data.success) {
                  setMode('live')
                } else {
                  Alert.alert('Error', data.error || 'Failed to switch')
                }
              } catch (e: any) {
                Alert.alert('Error', e.message)
              }
              setSwitching(false)
            },
          },
        ],
      )
    } else {
      setSwitching(true)
      try {
        const res = await fetch(`${API_BASE}/api/v1/mode`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: newMode }),
        })
        const data = await res.json()
        if (data.success) {
          setMode(newMode)
        } else {
          Alert.alert('Error', data.error || 'Failed to switch')
        }
      } catch (e: any) {
        Alert.alert('Error', e.message)
      }
      setSwitching(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trading Mode</Text>
        <View style={styles.modeRow}>
          {MODES.map(m => (
            <TouchableOpacity
              key={m.value}
              style={[styles.modeBtn, mode === m.value && styles.modeBtnActive]}
              onPress={() => handleModeChange(m.value)}
              disabled={switching}
            >
              <Text style={[styles.modeText, mode === m.value && styles.modeTextActive]}>
                {switching ? '...' : m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Auto Trading</Text>
        <TouchableOpacity
          style={[styles.toggle, autoTrade && styles.toggleOn]}
          onPress={() => setAutoTrade(!autoTrade)}
        >
          <Text style={styles.toggleText}>{autoTrade ? 'ON' : 'OFF'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>OKX Live API Keys</Text>
        <Text style={styles.hint}>Set in packages/backend/.env on the server</Text>
        <TextInput style={styles.input} placeholder="OKX_API_KEY" placeholderTextColor="#555" editable={false} />
        <TextInput style={styles.input} placeholder="OKX_SECRET" placeholderTextColor="#555" secureTextEntry editable={false} />
        <TextInput style={styles.input} placeholder="OKX_PASSPHRASE" placeholderTextColor="#555" secureTextEntry editable={false} />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23', padding: 16 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 20, marginTop: 50 },
  section: { marginBottom: 24 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 10 },
  hint: { color: '#666', fontSize: 12, marginBottom: 8 },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#1a1a2e', alignItems: 'center' },
  modeBtnActive: { backgroundColor: '#4ade80' },
  modeText: { color: '#888', fontWeight: '600' },
  modeTextActive: { color: '#000' },
  toggle: { padding: 14, borderRadius: 8, backgroundColor: '#1a1a2e', alignItems: 'center', width: 80 },
  toggleOn: { backgroundColor: '#4ade80' },
  toggleText: { color: '#fff', fontWeight: 'bold' },
  input: {
    backgroundColor: '#1a1a2e', color: '#555', borderRadius: 8, padding: 12, marginBottom: 8, fontSize: 14,
  },
  logoutBtn: { padding: 14, borderRadius: 8, borderColor: '#ef4444', borderWidth: 1, alignItems: 'center', marginTop: 20 },
  logoutText: { color: '#ef4444', fontWeight: 'bold' },
})

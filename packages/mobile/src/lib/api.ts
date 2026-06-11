const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001'

async function get(path: string) {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export const api = {
  getStatus: () => get('/api/v1/status'),
  getAnalysis: (pair: string, timeframe: string) =>
    get(`/api/v1/analysis?pair=${pair}&timeframe=${timeframe}`),
  getPositions: () => get('/api/v1/positions'),
}

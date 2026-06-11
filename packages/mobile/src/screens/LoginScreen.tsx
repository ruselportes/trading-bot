import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useAuthStore } from '../store/auth'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const { signIn, signUp, loading } = useAuthStore()

  const handleSubmit = async () => {
    try {
      if (isSignUp) {
        await signUp(email, password)
        Alert.alert('Check your email', 'Verify your email address to sign in.')
      } else {
        await signIn(email, password)
      }
    } catch (e: any) {
      Alert.alert('Error', e.message)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trading Bot</Text>
      <Text style={styles.subtitle}>OKX + SMC Strategy</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
        <Text style={styles.link}>
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23', justifyContent: 'center', padding: 24 },
  title: { color: '#fff', fontSize: 32, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { color: '#4ade80', fontSize: 14, textAlign: 'center', marginBottom: 40, marginTop: 4 },
  input: {
    backgroundColor: '#1a1a2e',
    color: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4ade80',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  link: { color: '#4ade80', textAlign: 'center', marginTop: 16 },
})

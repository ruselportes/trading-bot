import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text, View } from 'react-native'
import DashboardScreen from './src/screens/DashboardScreen'
import ChartScreen from './src/screens/ChartScreen'
import PositionsScreen from './src/screens/PositionsScreen'
import SettingsScreen from './src/screens/SettingsScreen'
import PerformanceScreen from './src/screens/PerformanceScreen'

const Tab = createBottomTabNavigator()

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Dashboard: '📊',
    Chart: '📈',
    Positions: '💼',
    Settings: '⚙️',
    Performance: '📋',
  }
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20 }}>{icons[label] || '•'}</Text>
      <Text style={{ fontSize: 10, color: focused ? '#4ade80' : '#666', marginTop: 2 }}>
        {label}
      </Text>
    </View>
  )
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: { backgroundColor: '#1a1a2e', borderTopColor: '#2a2a3e', height: 70, paddingBottom: 8 },
          tabBarShowLabel: false,
          tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Chart" component={ChartScreen} />
        <Tab.Screen name="Positions" component={PositionsScreen} />
        <Tab.Screen name="Performance" component={PerformanceScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  )
}

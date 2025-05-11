// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../lib/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Theme.colors.primary,
        tabBarStyle: { 
          backgroundColor: Theme.colors.dark,
          borderTopWidth: 0 
        },
        headerShown: false
      }}>
      <Tabs.Screen 
        name="dashboard" 
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          )
        }}
      />
      <Tabs.Screen 
        name="history" 
        options={{
          tabBarLabel: 'Historique',
          tabBarIcon: ({ color }) => (
            <Ionicons name="stats-chart" size={24} color={color} />
          )
        }}
      />
       <Tabs.Screen 
  name="objectives" 
  options={{
    tabBarLabel: 'Objectifs',
    tabBarIcon: ({ color }) => {
      console.log('Rendering objectives tab');
      return <Ionicons name="trophy-outline" size={24} color={color} />;
    }
  }}
/>
    </Tabs>
  );
}
import { Slot, SplashScreen } from 'expo-router'
import { useEffect, useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../lib/firebase'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Initialisation sans redirection immédiate
    const unsubscribe = onAuthStateChanged(auth, async () => {
      await SplashScreen.hideAsync()
      setIsReady(true)
    })

    return unsubscribe
  }, [])

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  // Retourne uniquement le Slot sans logique de navigation
  return <Slot />
}
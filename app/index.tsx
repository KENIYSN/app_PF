import { Redirect, useRouter } from 'expo-router'
import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../lib/firebase'

export default function Index() {
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/(tabs)/dashboard')
      } else {
        router.replace('/(auth)/login')
      }
    })

    return unsubscribe
  }, [])

  return null // Rendu temporaire vide
}
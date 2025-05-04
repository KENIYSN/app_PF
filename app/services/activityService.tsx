import { doc, setDoc, increment } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../../lib/firebase";

const CACHE_KEY = "dailyActivity_v2";
const CACHE_DURATION = 86400000; // 24h

interface ActivityData {
  steps: number;
  distance: number;
  calories: number;
  timestamp: number;
  userId?: string;
}

export const initializeUser = async (userId: string) => {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
    steps: 0,
    distance: 0,
    calories: 0,
    timestamp: Date.now(),
    userId
  }));
};

export const updateActivity = async (data: Partial<ActivityData>) => {
  const current = await getActivity();
  const updated = { ...current, ...data, timestamp: Date.now() };
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(updated));
};

export const getActivity = async (): Promise<ActivityData> => {
  const data = await AsyncStorage.getItem(CACHE_KEY);
  return data ? JSON.parse(data) : {
    steps: 0,
    distance: 0,
    calories: 0,
    timestamp: Date.now()
  };
};

export const syncWithFirestore = async (userId: string) => {
  const cache = await getActivity();
  const today = new Date().toISOString().split("T")[0];
  
  await setDoc(doc(db, "users", userId, "activities", today), {
    steps: increment(cache.steps),
    distance: increment(cache.distance),
    calories: increment(cache.calories),
    lastUpdated: new Date()
  }, { merge: true });

  await AsyncStorage.removeItem(CACHE_KEY);
};

// Ajout d'un export par défaut factice pour satisfaire le système de routage
export default {};
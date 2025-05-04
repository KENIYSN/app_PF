import { doc, setDoc, getDoc, increment, serverTimestamp } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../../lib/firebase";

const CACHE_KEY = "dailyActivity_final_v2";
const CACHE_DURATION = 86400000; // 24h EST 86400000 ms 60000 pour tester

interface ActivityData {
  steps: number;
  distance: number;
  calories: number;
  timestamp: number;
  userId: string;
  isNewUser: boolean;
}

// Initialisation pour nouveaux utilisateurs
export const initializeUserActivity = async (userId: string): Promise<void> => {
  // 1. Purge complète du cache existant
  await AsyncStorage.removeItem(CACHE_KEY);

  // 2. Création d'un nouveau cache vierge
  const defaultData: ActivityData = {
    steps: 0,
    distance: 0,
    calories: 0,
    timestamp: Date.now(),
    userId,
    isNewUser: true
  };
  
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(defaultData));

  // 3. Initialisation Firestore avec vérification explicite
  const today = new Date().toISOString().split("T")[0];
  const docRef = doc(db, "users", userId, "activities", today);
  
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    await setDoc(docRef, {
      steps: 0,
      distance: 0,
      calories: 0,
      lastUpdated: serverTimestamp(),
      userId
    });
  }
};

// Récupération du cache local
export const getActivityCache = async (): Promise<ActivityData> => {
  const data = await AsyncStorage.getItem(CACHE_KEY);
  if (!data) {
    return {
      steps: 0,
      distance: 0,
      calories: 0,
      timestamp: Date.now(),
      userId: "",
      isNewUser: true
    };
  }
  return JSON.parse(data);
};

// Mise à jour du cache local uniquement
export const updateActivityCache = async (newData: Partial<ActivityData>): Promise<void> => {
  const current = await getActivityCache();
  const updated: ActivityData = {
    ...current,
    ...newData,
    timestamp: Date.now(),
    isNewUser: false
  };
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(updated));
};

// Synchronisation avec Firestore
export const syncWithFirestore = async (userId: string): Promise<void> => {
  console.log("Tentative de synchronisation déclenchée");
  const cache = await getActivityCache();
  
  if (cache.userId !== userId) {
    console.log("UserId mismatch - annulation");
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  const docRef = doc(db, "users", userId, "activities", today);

  try {
    console.log("Récupération des données Firestore...");
    const docSnap = await getDoc(docRef);
    const firestoreData = docSnap.exists() ? docSnap.data() : null;

    const updateData = {
      steps: firestoreData?.steps ? increment(cache.steps) : cache.steps,
      distance: firestoreData?.distance ? increment(cache.distance) : cache.distance,
      calories: firestoreData?.calories ? increment(cache.calories) : cache.calories,
      lastUpdated: serverTimestamp(),
      userId
    };

    console.log("Données à envoyer:", updateData);
    await setDoc(docRef, updateData, { merge: true });

    console.log("Suppression du cache local");
    await AsyncStorage.removeItem(CACHE_KEY);
    console.log("✅ Synchronisation réussie à", new Date().toISOString());

  } catch (error) {
    console.error("❌ Erreur de sync:", error);
    await updateActivityCache({ isNewUser: false });
    throw error;
  }
};

// Gestion de la connexion
export const onUserLogin = async (userId: string): Promise<void> => {
  try {
    const cache = await getActivityCache();
    
    // Nouvel utilisateur ou cache corrompu
    if (cache.userId !== userId) {
      await initializeUserActivity(userId);
      return;
    }

    // Cache expiré -> synchronisation
    const isCacheExpired = Date.now() - cache.timestamp > CACHE_DURATION;
    if (isCacheExpired) {
      await syncWithFirestore(userId);
    }

  } catch (error) {
    console.error("Login error:", error);
    await initializeUserActivity(userId);
  }
};

// Gestion de la déconnexion
export const onUserLogout = async (userId: string): Promise<void> => {
  try {
    await syncWithFirestore(userId);
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};

// Chargement des données (priorité à Firestore)
export const loadActivityData = async (userId: string): Promise<ActivityData> => {
  try {
    // 1. Chargement depuis Firestore
    const today = new Date().toISOString().split("T")[0];
    const docRef = doc(db, "users", userId, "activities", today);
    const docSnap = await getDoc(docRef);

    let firestoreData = { steps: 0, distance: 0, calories: 0 };
    if (docSnap.exists()) {
      const data = docSnap.data();
      firestoreData = {
        steps: data.steps || 0,
        distance: data.distance || 0,
        calories: data.calories || 0
      };
    }

    // 2. Vérifier le cache local seulement si userId correspond
    const cache = await getActivityCache();
    const useCache = cache.userId === userId && !cache.isNewUser;

    return {
      steps: useCache ? firestoreData.steps + cache.steps : firestoreData.steps,
      distance: useCache ? firestoreData.distance + cache.distance : firestoreData.distance,
      calories: useCache ? firestoreData.calories + cache.calories : firestoreData.calories,
      timestamp: Date.now(),
      userId,
      isNewUser: false
    };

  } catch (error) {
    console.error("Load error:", error);
    return {
      steps: 0,
      distance: 0,
      calories: 0,
      timestamp: Date.now(),
      userId,
      isNewUser: true
    };
  }
};
// Ajoutez cette nouvelle fonction
export const startAutoSync = (userId: string) => {
  const interval = setInterval(async () => {
    const cache = await getActivityCache();
    const isCacheExpired = Date.now() - cache.timestamp > CACHE_DURATION;
    
    if (isCacheExpired && cache.userId === userId && cache.steps > 0) {
      console.log('Auto-sync déclenchée');
      await syncWithFirestore(userId);
    }
  }, 30000); // Vérifie toutes les 30 secondes

  return () => clearInterval(interval); // Cleanup function
};
export const checkAndSyncIfNeeded = async (userId: string): Promise<boolean> => {
  const cache = await getActivityCache();
  const isCacheExpired = Date.now() - cache.timestamp > CACHE_DURATION;
  
  if (isCacheExpired && cache.userId === userId && cache.steps > 0) {
    console.log('Cache expiré - synchronisation automatique déclenchée');
    await syncWithFirestore(userId);
    return true;
  }
  return false;
};

// Ajout d'un export par défaut factice pour satisfaire le système de routage
export default {};
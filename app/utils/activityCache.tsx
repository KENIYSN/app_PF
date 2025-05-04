// utils/activityCache.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_KEY = "dailyActivity";

// Récupère les données d'activité en cache
export const getActivityFromCache = async (): Promise<{
  steps: number;
  distance: number;
  calories: number;
  timestamp: number;
}> => {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (!cached) {
      // Si aucune donnée en cache, on retourne les valeurs par défaut
      return {
        steps: 0,
        distance: 0,
        calories: 0,
        timestamp: Date.now(),
      };
    }

    const data = JSON.parse(cached);
    return {
      steps: data.steps || 0,
      distance: data.distance || 0,
      calories: data.calories || 0,
      timestamp: data.timestamp || Date.now(),
    };
  } catch (error) {
    console.error("Erreur lors de la lecture du cache :", error);
    // En cas d'erreur, retourner les valeurs par défaut
    return {
      steps: 0,
      distance: 0,
      calories: 0,
      timestamp: Date.now(),
    };
  }
};

// Sauvegarde les données d'activité en cache
export const saveActivityToCache = async (
  steps: number,
  distance: number,
  calories: number
) => {
  const data = {
    steps,
    distance,
    calories,
    timestamp: Date.now(),
  };

  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
    console.log("Données d'activité sauvegardées en cache !");
  } catch (error) {
    console.error("Erreur lors de la sauvegarde dans le cache :", error);
  }
};

// Fonction pour nettoyer le cache (par exemple, lors de la création d'un nouvel utilisateur)
export const clearActivityCache = async () => {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
    console.log("🧹 Cache d'activité vidé !");
  } catch (error) {
    console.error("Erreur lors du nettoyage du cache :", error);
  }
};

// Fonction pour réinitialiser le cache (quand un utilisateur se connecte ou crée un compte)
export const resetActivityForNewUser = async () => {
  await clearActivityCache(); // Vide le cache existant
  await saveActivityToCache(0, 0, 0); // Réinitialise à zéro
};

// Ajout d'un export par défaut factice pour satisfaire le système de routage
export default {};

import { useEffect } from "react";
import { 
  initializeUser,
  syncWithFirestore,
  getActivity
} from "../services/activityService";

export const useActivityTracker = (userId: string | undefined) => {
  useEffect(() => {
    if (!userId) return;

    const setup = async () => {
      const cache = await getActivity();
      
      // Réinitialise si nouvel utilisateur ou utilisateur différent
      if (!cache.userId || cache.userId !== userId) {
        await initializeUser(userId);
      }

      // Synchronisation périodique
      const interval = setInterval(() => {
        syncWithFirestore(userId);
      }, 3600000); // Toutes les heures

      return () => clearInterval(interval);
    };

    setup();
  }, [userId]);
};

// Ajout d'un export par défaut factice pour satisfaire le système de routage
export default {};
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

export async function getDailyActivity() {
  const userId = auth.currentUser?.uid;
  if (!userId) return null;

  const today = new Date().toISOString().split("T")[0]; // Format YYYY-MM-DD
  try {
    // Accède au document de l'utilisateur pour la date actuelle
    const docRef = doc(db, "users", userId, "activities", today);
    const docSnap = await getDoc(docRef);
    console.log("Données récupérées de Firebase:", ); 

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        steps: data?.steps || 0,
        distance: data?.distance || 0,
        calories: data?.calories || 0,
      };
    }
    return null; // Si pas de données pour aujourd'hui
  } catch (error) {
    console.error("Erreur lors de la récupération des activités :", error);
    return null;
  }
  
}

// Ajout d'un export par défaut factice pour satisfaire le système de routage
export default {};

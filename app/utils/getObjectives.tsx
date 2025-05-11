import { db } from "../../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

interface Objectives {
  steps: number;
  calories: number;
  distance: number;
}

export const getObjectivesByUser = async (userId: string): Promise<Objectives> => {
  try {
    console.log("🔍 userId utilisé pour la requête:", userId);

    const q = query(collection(db, "objectives"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    const objectives: Objectives = {
      steps: 0,
      calories: 0,
      distance: 0,
    };

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.type && data.value !== undefined) {
        switch (data.type) {
          case "steps":
            objectives.steps = data.value;
            break;
          case "calories":
            objectives.calories = data.value;
            break;
          case "distance":
            objectives.distance = data.value;
            break;
        }
      }
    });

    return objectives;
  } catch (error) {
    console.error("Erreur lors de la récupération des objectifs:", error);
    return {
      steps: 0,
      calories: 0,
      distance: 0,
    };
  }
};

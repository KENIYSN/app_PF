import { db } from "../../lib/firebase";
import { collection, addDoc, Timestamp } from 'firebase/firestore';

interface SaveObjectiveParams {
  userId: string;
  type: string;
  value: number;
}

export const saveObjectives = async ({ userId, type, value }: SaveObjectiveParams): Promise<string | undefined> => {
  if (!userId || !type || value === undefined) {
    console.error('Erreur : Paramètres manquants ou invalides:', { userId, type, value });
    return; 
  }

  try {
    console.log('Enregistrement dans la collection : objectives');

    // Ajouter un document dans la collection 'objectives'
    const docRef = await addDoc(collection(db, 'objectives'), {
      userId,
      type,
      value,
      createdAt: Timestamp.now(), // Utilisation de l'horodatage actuel
    });

    console.log('Objectif enregistré avec ID :', docRef.id);
    return docRef.id; // Retourne l'ID du document ajouté
  } catch (error) {
    if (error instanceof Error) {
      console.error('Erreur lors de l’enregistrement de l’objectif :', error.message);
    } else {
      console.error('Erreur inconnue:', error);
    }
    throw error; // Rejeter l'erreur si quelque chose se passe mal
  }
};

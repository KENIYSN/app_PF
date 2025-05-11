import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { saveObjectives } from '../utils/saveObjectives'; 
import { auth } from '../../lib/firebase'; 
import { Theme } from "../../lib/theme";

const CreateObjectivesCalories = () => {
  const router = useRouter();
  const [caloriesGoal, setCaloriesGoal] = useState(1000);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      
      if (user && user.uid) {
        setUserId(user.uid); 
      } else {
        setUserId(null); 
      }
    });

    return unsubscribe; 
  }, []);

  const increaseCalories = () => setCaloriesGoal(prev => prev + 10);
  const decreaseCalories = () => setCaloriesGoal(prev => Math.max(prev - 10, 10));

  const handleSave = async () => {
    if (userId) {
      
      await saveObjectives({
        userId: userId,
        type: 'calories',
        value: caloriesGoal
      });

      
      router.push("/objectives");
    } else {
      console.log("Utilisateur non authentifié");
    }
  };

  return (  // <-- Voici l'accolade manquante
    <View style={styles.overlay}>
      <View style={styles.container}>
        <Text style={styles.title}>Votre objectif {"\n"} du jour</Text>
        <Text style={styles.subtitle}>Quel objectif de calories souhaitez-vous atteindre aujourd’hui ?</Text>

        <View style={styles.counterContainer}>
          <TouchableOpacity style={styles.counterButtonMinus} onPress={decreaseCalories}>
            <Text style={styles.counterButtonText}>-</Text>
          </TouchableOpacity>

          <Text style={styles.counterText}>{caloriesGoal}</Text>

          <TouchableOpacity style={styles.counterButtonPlus} onPress={increaseCalories}>
            <Text style={styles.counterButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.unitText}>Kcal/JOUR</Text>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Go</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};  // <-- Accolade fermante ajoutée ici

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radii.lg,
    padding: Theme.paddings.md,
    width: width - 60,
    alignItems: 'center',
  },
  title: {
    fontSize: Theme.fontSizes.lg,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.primary,
    textAlign: 'center',
    marginBottom: Theme.spacing.sm,
  },
  subtitle: {
    fontSize: Theme.fontSizes.sm,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.secondary,
    textAlign: 'center',
    marginBottom: Theme.spacing.md,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  counterButtonMinus: {
    backgroundColor: '#D9D9D9',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: Theme.spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 5,
    elevation: 5,
  },
  counterButtonPlus: {
    backgroundColor: '#D9D9D9',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: Theme.spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 5,
    elevation: 5,
  },
  counterButtonText: {
    color: Theme.colors.white,
    fontSize: 28,
    fontFamily: Theme.fonts.bold,
  },
  counterText: {
    fontSize: 48,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.white,
  },
  unitText: {
    fontSize: Theme.fontSizes.sm,
    color: Theme.colors.secondary,
    marginBottom: Theme.spacing.md,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 5,
    elevation: 5,
  },
  saveButtonText: {
    color: Theme.colors.white,
    fontSize: Theme.fontSizes.md,
    fontFamily: Theme.fonts.bold,
  },
});

export default CreateObjectivesCalories;

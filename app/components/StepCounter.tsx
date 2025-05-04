import React, { useEffect, useRef, useState } from "react";
import { Pedometer } from "expo-sensors";
import { Platform, PermissionsAndroid, Alert } from "react-native";
import Constants from "expo-constants";
import { updateActivityCache } from "../utils/activityManager";

interface StepCounterProps {
  onStepsChanged: (steps: number, distance: number, calories: number) => void;
  userId?: string;
}

const StepCounter: React.FC<StepCounterProps> = ({ onStepsChanged, userId }) => {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const baselineSteps = useRef<number>(0);
  const currentSteps = useRef<number>(0);
  const subscriptionRef = useRef<any>(null);

  const checkPermissions = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const { status } = await Pedometer.requestPermissionsAsync();
        return status === 'granted';
      }
    } catch (error) {
      console.error("Permission error:", error);
      return false;
    }
  };

  const initializeStepCounter = async () => {
    try {
      const pedometerAvailable = await Pedometer.isAvailableAsync();
      setIsAvailable(pedometerAvailable);
      
      if (!pedometerAvailable) {
        Alert.alert(
          "Fonctionnalité indisponible",
          "Le compteur de pas n'est pas disponible sur cet appareil"
        );
        return;
      }

      const hasPermission = await checkPermissions();
      if (!hasPermission) {
        Alert.alert(
          "Permission requise",
          "L'application a besoin d'accéder aux données de pas"
        );
        return;
      }

      // Réinitialiser les compteurs pour un nouvel utilisateur
      baselineSteps.current = 0;
      currentSteps.current = 0;

      if (Platform.OS === 'ios') {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        
        try {
          const { steps } = await Pedometer.getStepCountAsync(startOfDay, new Date());
          baselineSteps.current = steps;
        } catch (error) {
          console.warn("Error getting initial steps:", error);
        }
      }

      subscriptionRef.current = Pedometer.watchStepCount((result) => {
        const newSteps = Platform.OS === 'ios' 
          ? result.steps // On utilise directement les pas du watchStepCount pour iOS
          : result.steps;

        if (newSteps > currentSteps.current) {
          currentSteps.current = newSteps;
          const distance = newSteps * 0.000762;
          const calories = Math.round(newSteps * 0.04);

          onStepsChanged(newSteps, distance, calories);
          
          if (userId) {
            updateActivityCache({
              steps: newSteps,
              distance,
              calories,
              userId
            }).catch(console.error);
          }
        }
      });

    } catch (error) {
      console.error("Step counter initialization failed:", error);
      setIsAvailable(false);
    }
  };

  useEffect(() => {
    initializeStepCounter();

    return () => {
      if (subscriptionRef.current?.remove) {
        subscriptionRef.current.remove();
      }
    };
  }, [userId]);

  return null;
};

export default StepCounter;
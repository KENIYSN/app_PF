import React, { useEffect, useRef, useState } from "react";
import { Pedometer } from "expo-sensors";
import { Platform, PermissionsAndroid, Alert } from "react-native";
import Constants from "expo-constants";
import { updateActivityCache, getActivityCache } from "../utils/activityManager";

interface StepCounterProps {
  onStepsChanged: (steps: number, distance: number, calories: number) => void;
  userId?: string;
  initialSteps?: number;
}

const StepCounter: React.FC<StepCounterProps> = ({ onStepsChanged, userId, initialSteps = 0 }) => {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const baselineSteps = useRef<number>(0);
  const currentSteps = useRef<number>(initialSteps);
  const subscriptionRef = useRef<any>(null);
  const lastStepCount = useRef<number>(0);

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

      // Initialiser avec les pas existants
      baselineSteps.current = initialSteps;
      currentSteps.current = initialSteps;
      lastStepCount.current = 0;

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
          ? result.steps
          : result.steps;

        // Calculer la différence depuis le dernier pas
        const stepDifference = newSteps - lastStepCount.current;
        if (stepDifference > 0) {
          // Ajouter la différence aux pas actuels
          currentSteps.current += stepDifference;
          lastStepCount.current = newSteps;

          const totalSteps = currentSteps.current;
          const distance = totalSteps * 0.000762;
          const calories = Math.round(totalSteps * 0.04);

          onStepsChanged(totalSteps, distance, calories);
          
          if (userId) {
            updateActivityCache({
              steps: totalSteps,
              distance,
              calories,
              userId,
              timestamp: Date.now()
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
  }, [userId, initialSteps]);

  return null;
};

export default StepCounter;
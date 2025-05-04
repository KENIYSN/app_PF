import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Pedometer from 'expo-sensors/build/Pedometer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STEP_TRACKING_TASK = 'STEP_TRACKING_TASK';

TaskManager.defineTask(STEP_TRACKING_TASK, async () => {
  try {
    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0); // depuis minuit

    const result = await Pedometer.getStepCountAsync(start, end);
    const steps = result?.steps ?? 0;

    // Calcul distance et calories
    const distance = steps * 0.0008; // en km
    const calories = steps * 0.04;

    // Sauvegarde dans AsyncStorage
    await AsyncStorage.setItem('dailySteps', steps.toString());
    await AsyncStorage.setItem('dailyDistance', distance.toString());
    await AsyncStorage.setItem('dailyCalories', calories.toString());

    console.log(`[STEP_TASK] Steps: ${steps}, Distance: ${distance} km, Calories: ${calories}`);

    return BackgroundFetch.BackgroundFetchResult.NewData;

  } catch (error) {
    console.error('[STEP_TASK] Error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function startStepTrackingTask() {
  const isAvailable = await TaskManager.isAvailableAsync();

  if (!isAvailable) {
    console.warn('TaskManager n\'est pas disponible');
    return;
  }

  const status = await BackgroundFetch.getStatusAsync();

  if (status === BackgroundFetch.BackgroundFetchStatus.Restricted || status === BackgroundFetch.BackgroundFetchStatus.Denied) {
    console.warn('Le background fetch est désactivé');
    return;
  }

  const isTaskDefined = await TaskManager.isTaskDefined(STEP_TRACKING_TASK);

  const isRegistered = await TaskManager.isTaskRegisteredAsync(STEP_TRACKING_TASK);

  if (!isRegistered) {
    await BackgroundFetch.registerTaskAsync(STEP_TRACKING_TASK, {
      minimumInterval: 60 * 60, // toutes les heures
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('[STEP_TASK] Tâche enregistrée');
  } else {
    console.log('[STEP_TASK] Tâche déjà enregistrée');
  }
}

// Ajout d'un export par défaut factice pour satisfaire le système de routage
export default {};

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  PermissionsAndroid,
  Platform
} from "react-native";
import { Svg, Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../../lib/theme";
import { signOut } from "firebase/auth";
import { useRouter } from "expo-router";
import * as Pedometer from 'expo-sensors';
import {
  updateActivityCache,
  getActivityCache,
  onUserLogin,
  onUserLogout,
  startAutoSync,
  loadActivityData,
  checkAndSyncIfNeeded 
} from "../utils/activityManager";
import StepCounter from "../components/StepCounter";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type PlanCardProps = {
  time: string;
  label: string;
  value?: string;
  goal?: string;
};

const PlanCard: React.FC<PlanCardProps> = ({ time, label, value, goal }) => (
  <View style={styles.planCard}>
    <Text style={styles.planTime}>{time}</Text>
    <Text style={styles.planLabel}>{label}</Text>
    {value && <Text style={styles.planValue}>{value}</Text>}
    {goal && (
      <View style={styles.goalBadge}>
        <Text style={styles.goalText}>{goal}</Text>
      </View>
    )}
  </View>
);

const dashboard = () => {
  const router = useRouter();
  const { width } = Dimensions.get("window");
  const [steps, setSteps] = useState(0);
  const [distance, setDistance] = useState(0);
  const [calories, setCalories] = useState(0);
  const [activityLoaded, setActivityLoaded] = useState(false);
  const [isPedometerAvailable, setIsPedometerAvailable] = useState<boolean | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);

  const goalSteps = 10000;
  const progress = useSharedValue(0);
  const kcal = useSharedValue(0);

  const size = width * 0.3;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [isSyncing, setIsSyncing] = useState(false);
  const CACHE_DURATION = 60000;

  useEffect(() => {
    const syncInterval = setInterval(async () => {
      if (!auth.currentUser?.uid || isSyncing) return;
      
      setIsSyncing(true);
      try {
        const wasSynced = await checkAndSyncIfNeeded(auth.currentUser.uid);
        if (wasSynced) {
          // Recharger les données après sync
          const activity = await loadActivityData(auth.currentUser.uid);
          const cache = await getActivityCache();
          
          const combinedData = {
            steps: activity.steps + (cache.userId === auth.currentUser.uid ? cache.steps : 0),
            distance: activity.distance + (cache.userId === auth.currentUser.uid ? cache.distance : 0),
            calories: activity.calories + (cache.userId === auth.currentUser.uid ? cache.calories : 0),
            timestamp: Math.max(activity.timestamp, cache.timestamp)
          };

          setSteps(combinedData.steps);
          setDistance(combinedData.distance);
          setCalories(combinedData.calories);
          setLastSyncTime(combinedData.timestamp);
        }
      } catch (error) {
        console.error('Auto-sync error:', error);
      } finally {
        setIsSyncing(false);
      }
    }, 30000); // Vérifie toutes les 30 secondes

    return () => clearInterval(syncInterval);
  }, [isSyncing]);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const handleStepsChanged = (newSteps: number, newDistance: number, newCalories: number) => {
    setSteps(newSteps);
    setDistance(newDistance);
    setCalories(newCalories);
    
    if (auth.currentUser?.uid) {
      updateActivityCache({
        steps: newSteps,
        distance: newDistance,
        calories: newCalories,
        userId: auth.currentUser.uid,
        timestamp: Date.now() // Ajout du timestamp
      }).catch(console.error);
    }
  };

  const loadUserActivity = useCallback(async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      await onUserLogin(userId);
      
      // Charger les données de Firestore
      const activity = await loadActivityData(userId);
      
      // Récupérer le cache local
      const cache = await getActivityCache();
      
      // Combiner les données Firestore avec le cache local
      const combinedData = {
        steps: activity.steps + (cache.userId === userId ? cache.steps : 0),
        distance: activity.distance + (cache.userId === userId ? cache.distance : 0),
        calories: activity.calories + (cache.userId === userId ? cache.calories : 0),
        timestamp: Math.max(activity.timestamp, cache.timestamp)
      };
      
      setSteps(combinedData.steps);
      setDistance(combinedData.distance);
      setCalories(combinedData.calories);
      setLastSyncTime(combinedData.timestamp);
      setActivityLoaded(true);

      // Vérifier immédiatement si besoin de sync
      if (Date.now() - combinedData.timestamp > CACHE_DURATION) {
        await checkAndSyncIfNeeded(userId);
      }
    } catch (error) {
      console.error("Failed to load activity:", error);
      setActivityLoaded(true);
    }
  }, []);

  useEffect(() => {
    progress.value = withTiming(steps / goalSteps, { duration: 1000 });
    kcal.value = withTiming(calories, { duration: 1000 });
  }, [steps, calories]);

  useEffect(() => {
    loadUserActivity();
  }, [loadUserActivity]);

  const handleLogout = async () => {
    const userId = auth.currentUser?.uid;
    if (userId) {
      await onUserLogout(userId);
      await signOut(auth);
      router.replace("/");
    }
  };

  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const displayedKcal = useDerivedValue(() => `${Math.round(kcal.value)} kcal`);

  if (!activityLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <StepCounter 
        onStepsChanged={handleStepsChanged} 
        userId={auth.currentUser?.uid} 
      />

      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <TouchableOpacity onPress={() => router.push("../profile/profile")}>
          <Ionicons name="person-circle-outline" size={40} color="white" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>My Plan</Text>
      <View style={styles.planContainer}>
        <PlanCard time="11:00 AM" label="Weight" value="150 lbs" goal="Goal 190 lbs" />
        <PlanCard time="1:30 hr" label="Muscle" />
      </View>

      <Text style={styles.sectionTitle}>Activity</Text>
      <View style={styles.activityContainer}>
        <View style={styles.leftContainer}>
          <Text style={styles.titlea}>Steps:</Text>
          <Text style={styles.steps}>{steps}</Text>

          <Text style={styles.titlea}>Distance:</Text>
          <Text style={styles.steps}>{distance.toFixed(2)} km</Text>

          <Text style={styles.titlea}>Calories:</Text>
          <Text style={styles.steps}>{calories} kcal</Text>

          {isPedometerAvailable === false && (
            <Text style={styles.warningText}>Step counter not available on this device</Text>
          )}
        </View>

        <View style={styles.rightContainer}>
          <Svg width={size} height={size}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#D9D9D9"
              strokeWidth={strokeWidth}
              fill="none"
            />
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#FCA311"
              strokeWidth={strokeWidth}
              fill="none"
              animatedProps={animatedCircleProps}
              strokeLinecap="round"
              strokeDasharray={`${circumference}, ${circumference}`}
              rotation="-90"
              originX={size / 2}
              originY={size / 2}
            />
          </Svg>
          <View style={styles.stepsGoalContainer}>
            <Text style={styles.kcalText}>{steps}
              <Text style={styles.goalText}> / {goalSteps}</Text>
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.syncInfo}>
        Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.dark,
  },
  scrollContent: {
    padding: Theme.paddings.lg,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.dark,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.lg,
    paddingTop: Theme.spacing.xl,
  },
  title: {
    fontSize: Theme.fontSizes.xxl,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.primary,
  },
  logoutButton: {
    alignSelf: "flex-end",
    marginBottom: 10,
  },
  logoutText: {
    color: Theme.colors.primary,
    fontFamily: Theme.fonts.semiBold,
  },
  sectionTitle: {
    fontSize: Theme.fontSizes.xl,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.white,
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
  },
  planContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: Theme.spacing.xs,
  },
  planCard: {
    backgroundColor: "#2C2C2E",
    padding: Theme.paddings.md,
    borderRadius: 20,
    width: "48%",
    justifyContent: "center",
    gap: 4,
  },
  planTime: {
    color: "#A0A0A0",
    fontSize: Theme.fontSizes.sm,
    fontFamily: Theme.fonts.medium,
  },
  planLabel: {
    color: Theme.colors.white,
    fontSize: Theme.fontSizes.md,
    fontFamily: Theme.fonts.bold,
  },
  planValue: {
    color: Theme.colors.white,
    fontSize: Theme.fontSizes.sm,
    fontFamily: Theme.fonts.medium,
  },
  goalBadge: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.paddings.sm,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  goalText: {
    color: Theme.colors.white,
    fontFamily: Theme.fonts.bold,
    fontSize: Theme.fontSizes.sm,
  },
  activityContainer: {
    flexDirection: "row",
    backgroundColor: "#333333",
    borderRadius: Theme.radii.lg,
    padding: Theme.paddings.md,
    marginTop: Theme.spacing.xs,
  },
  leftContainer: {
    flex: 1,
    gap: Theme.spacing.xxs,
  },
  rightContainer: {
    flex: 0.5,
    alignItems: "center",
    justifyContent: "center",
  },
  titlea: {
    fontSize: Theme.fontSizes.md,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.primary,
    marginBottom: Theme.spacing.xs,
  },
  stepsGoalContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    transform: [{ translateY: -16 }],
  },
  kcalText: {
    fontSize: Theme.fontSizes.lg,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.white,
  },
  steps: {
    fontSize: Theme.fontSizes.md,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.white,
    marginBottom: Theme.spacing.xs,
  },
  warningText: {
    color: Theme.colors.primary,
    fontSize: Theme.fontSizes.sm,
    marginTop: Theme.spacing.sm,
  },
  syncInfo: {
    color: Theme.colors.secondary,
    fontSize: Theme.fontSizes.sm,
    textAlign: 'center',
    marginTop: Theme.spacing.sm,
  },
});

export default dashboard;
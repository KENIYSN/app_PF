import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';

// Remplace l'import dupliqué de @expo/vector-icons
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/core';
import { getDailyActivity } from '../utils/getDailyActivity';
import { getObjectivesByUser } from '../utils/getObjectives';
import { auth } from '../../lib/firebase';
import { Theme } from '../../lib/theme';
import { AnimatedProgressCircle } from '../components/ObjectivesCircleAnim';
import Animated, { useSharedValue, withTiming } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.5;

const Objectives = () => {
  const [steps, setSteps] = useState(0);
  const [calories, setCalories] = useState(0);
  const [distance, setDistance] = useState(0);
  const [objectives, setObjectives] = useState({ steps: 0, calories: 0, distance: 0 });

  const router = useRouter();
  const globalProgress = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      const loadActivityData = async () => {
        const user = auth.currentUser;
        if (!user) return;

        const activityData = await getDailyActivity();
        const userObjectives = await getObjectivesByUser(user.uid);

        if (activityData) {
          setSteps(activityData.steps);
          setCalories(activityData.calories);
          setDistance(activityData.distance);
        }

        setObjectives(userObjectives);
      };

      loadActivityData();
    }, [])
  );

  // Calcul du pourcentage global moyen
  const getGlobalPercentage = () => {
    const total = (objectives.steps || 1) + (objectives.calories || 1) + (objectives.distance || 1);
    const current = steps + calories + distance;
    return Math.min((current / total) * 100, 100); // max 100%
  };
  const displayedPercentage = Math.round(getGlobalPercentage());
  useEffect(() => {
    const percentage = getGlobalPercentage() / 100;
    globalProgress.value = withTiming(percentage, { duration: 1000 });
  }, [steps, calories, distance, objectives]);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Today's Objectives</Text>

        <View style={styles.circleContainer}>
          <View style={styles.circleWrapper}>
  <AnimatedProgressCircle progress={globalProgress} />

  {/* Icône bien centrée dans le cercle */}
  <MaterialCommunityIcons
    name="bullseye-arrow"
    size={48}
    color="#FFA500"
    style={styles.centerIcon}
  />
</View>
          <Text style={styles.percentageText}>{displayedPercentage}%</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Ionicons name="walk" size={20} color="white" />
            <Text style={styles.statValue}>{steps} / {objectives.steps}</Text>
            <Text style={styles.statLabel}>Steps</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons name="flame" size={20} color="white" />
            <Text style={styles.statValue}>{calories} / {objectives.calories}</Text>
            <Text style={styles.statLabel}>Kcal</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons name="map" size={20} color="white" />
            <Text style={styles.statValue}>{Number(distance).toFixed(2)} / {objectives.distance}</Text>
            <Text style={styles.statLabel}>Km</Text>
          </View>
        </View>

        <View style={styles.listContainer}>
        <TouchableOpacity 
  style={styles.listItem}
  onPress={() => router.push('../CreateObjectives/CreateObjectivesStep?goalType=steps')}
>

            <View style={styles.listItemLeft}>
              <Ionicons name="walk" size={20} color="#5F5FFF" style={{ marginRight: 10 }} />
              <Text style={styles.listItemText}>Steps</Text>
            </View>
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>

          <TouchableOpacity 
  style={styles.listItem}
  onPress={() => router.push('../CreateObjectives/CreateObjectivesCalories?goalType=calories')}
>

            <View style={styles.listItemLeft}>
              <Ionicons name="flame" size={20} color="#FF5F5F" style={{ marginRight: 10 }} />
              <Text style={styles.listItemText}>Les calories</Text>
            </View>
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>

          <TouchableOpacity 
  style={styles.listItem}
  onPress={() => router.push('../CreateObjectives/CreateObjectivesDistance?goalType=distance')}
>

            <View style={styles.listItemLeft}>
              <Ionicons name="map" size={20} color="#5FCFFF" style={{ marginRight: 10 }} />
              <Text style={styles.listItemText}>La distance</Text>
            </View>
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingBottom: 40,
    backgroundColor: Theme.colors.dark, 
  },
  container: {
    flex: 1,
    backgroundColor: Theme.colors.dark,
    paddingHorizontal: Theme.paddings.md,
  },
  title: {
    fontSize: Theme.fontSizes.xxl,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.primary,
    marginVertical: Theme.spacing.lg,
    marginHorizontal: Theme.spacing.md,
  },
  circleContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    position: 'relative', // Permet d'empiler l'icône et le cercle animé
  },
  
  
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#333333",
    borderRadius: Theme.radii.lg,
    padding: Theme.paddings.sm,
    marginTop: Theme.spacing.md,
    justifyContent: "space-between",
    width: "100%",
  },
  statBox: {
    alignItems: "center",
    backgroundColor: "#2C2C2E",
    padding: Theme.paddings.md,
    borderRadius: Theme.radii.md,
    width: "32%", 
    justifyContent: "center",
  },
  statValue: {
    color: Theme.colors.white,
    fontSize: Theme.fontSizes.md,
    fontFamily: Theme.fonts.medium,
  },
  percentageText: {
    fontSize: Theme.fontSizes.xl,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  statLabel: {
    color: Theme.colors.secondary,
    fontSize: Theme.fontSizes.sm,
    fontFamily: Theme.fonts.medium,
  },
  listContainer: {
    backgroundColor: "#1C1C1C",
    borderRadius: Theme.radii.lg,
    marginTop: Theme.spacing.md,
    width: "100%",
    paddingVertical: Theme.paddings.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Theme.paddings.md,
    paddingHorizontal: Theme.paddings.lg,
    borderBottomColor: '#2C2C2C',
    borderBottomWidth: 1,
    width: "100%",
  },
  listItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  listItemText: {
    color: Theme.colors.white,
    fontSize: Theme.fontSizes.md,
    fontFamily: Theme.fonts.medium,
  },
  circleWrapper: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  centerIcon: {
    position: 'absolute',
    zIndex: 2,
  },
});

export default Objectives;

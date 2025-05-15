import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';

// Remplace l'import dupliqué de @expo/vector-icons
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/core';
import { getObjectivesByUser } from '../utils/getObjectives';
import { auth } from '../../lib/firebase';
import { Theme } from '../../lib/theme';
import { AnimatedProgressCircle } from '../components/ObjectivesCircleAnim';
import Animated, { useSharedValue, withTiming } from 'react-native-reanimated';
import { loadActivityData, checkAndSyncIfNeeded, getActivityCache } from '../utils/activityManager';

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
      const loadData = async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
          // Vérifier et synchroniser si nécessaire
          await checkAndSyncIfNeeded(user.uid);
          
          // Charger les données d'activité depuis Firestore
          const activityData = await loadActivityData(user.uid);
          
          // Récupérer le cache local
          const cache = await getActivityCache();
          
          // Combiner les données Firestore avec le cache local
          const combinedData = {
            steps: activityData.steps + (cache.userId === user.uid ? cache.steps : 0),
            calories: activityData.calories + (cache.userId === user.uid ? cache.calories : 0),
            distance: activityData.distance + (cache.userId === user.uid ? cache.distance : 0)
          };

          // Mettre à jour l'état avec les données combinées
          setSteps(combinedData.steps);
          setCalories(combinedData.calories);
          setDistance(combinedData.distance);

          // Charger les objectifs
          const userObjectives = await getObjectivesByUser(user.uid);
          setObjectives(userObjectives);

        } catch (error) {
          console.error("Erreur lors du chargement des données:", error);
        }
      };

      loadData();
    }, [])
  );

  // Calcul du pourcentage global moyen
  const getGlobalPercentage = () => {
    // Créer un tableau des objectifs définis (non nuls et non zéro)
    const definedObjectives = [
      objectives.steps > 0 ? { current: steps, target: objectives.steps } : null,
      objectives.calories > 0 ? { current: calories, target: objectives.calories } : null,
      objectives.distance > 0 ? { current: distance, target: objectives.distance } : null
    ].filter(obj => obj !== null);

    // Si aucun objectif n'est défini, retourner 0
    if (definedObjectives.length === 0) return 0;

    // Calculer la moyenne des pourcentages pour chaque objectif défini
    const totalPercentage = definedObjectives.reduce((sum, obj) => {
      if (!obj) return sum;
      const percentage = (obj.current / obj.target) * 100;
      return sum + Math.min(percentage, 100); // Limiter à 100%
    }, 0);

    return totalPercentage / definedObjectives.length;
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
            <Text style={styles.statValue}>
              {objectives.steps > 0 ? `${steps} / ${objectives.steps}` : 0}
            </Text>
            <Text style={styles.statLabel}>Steps</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons name="flame" size={20} color="white" />
            <Text style={styles.statValue}>
              {objectives.calories > 0 ? `${calories} / ${objectives.calories}` : 0}
            </Text>
            <Text style={styles.statLabel}>Kcal</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons name="map" size={20} color="white" />
            <Text style={styles.statValue}>
              {objectives.distance > 0 ? `${Number(distance).toFixed(2)} / ${objectives.distance}` : 0}
            </Text>
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
    flex: 1,
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
    marginVertical: Theme.spacing.xl,
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

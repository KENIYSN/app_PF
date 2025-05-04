import React, { useEffect, useState } from "react";
import { Text, View, StyleSheet, Alert } from "react-native";
import * as Location from "expo-location";
import { Theme } from "../../lib/theme";
import { getActivityFromCache, saveActivityToCache } from "../utils/activityCache";

function toRad(x: number): number {
  return (x * Math.PI) / 180;
}

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en kilomètres
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export type DistanceCalculatorProps = {
  onDistanceCalculated?: (distance: number) => void;
};

const DistanceCalculator: React.FC<DistanceCalculatorProps> = ({ onDistanceCalculated }) => {
  const [distance, setDistance] = useState(0);
  const [prevCoords, setPrevCoords] = useState<Location.LocationObjectCoords | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription;

    const startTracking = async () => {
      const savedData = await getActivityFromCache();
      setDistance(savedData.distance);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission refusée", "Les permissions de localisation sont nécessaires pour suivre votre distance.");
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          if (location.coords && prevCoords) {
            const d = getDistanceFromLatLonInKm(
              prevCoords.latitude,
              prevCoords.longitude,
              location.coords.latitude,
              location.coords.longitude
            );
            const newDistance = distance + d;
            setDistance(newDistance);
            saveActivityToCache(0, newDistance, 0); // On sauvegarde seulement la distance
            if (onDistanceCalculated) onDistanceCalculated(newDistance);
          }
          setPrevCoords(location.coords);
        }
      );
    };

    startTracking();
    return () => subscription?.remove();
  }, [prevCoords, distance, onDistanceCalculated]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Distance parcourue</Text>
      <Text style={styles.distance}>{distance.toFixed(2)} km</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: Theme.radii.lg,
    marginTop: Theme.spacing.md,
  },
  title: {
    fontSize: Theme.fontSizes.lg,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.primary,
    marginBottom: Theme.spacing.xs,
  },
  distance: {
    fontSize: Theme.fontSizes.md,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.white,
  },
});

export default DistanceCalculator;
import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Theme } from "../../lib/theme";

type CaloriesCalculatorProps = {
  distance: number;
  onCaloriesCalculated: (newCalories: number) => void; // Modification ici
};

const CaloriesCalculator: React.FC<CaloriesCalculatorProps> = ({ 
  distance, 
  onCaloriesCalculated 
}) => {
  const calories = distance * 60;

  // Ajout crucial pour remonter les données
  useEffect(() => {
    onCaloriesCalculated(calories);
  }, [calories]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calories brûlées🔥</Text>
      <Text style={styles.calories}>{calories.toFixed(0)} kcal</Text>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    borderRadius: Theme.radii.lg,
  },
  title: {
    fontSize: Theme.fontSizes.lg,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.primary,
    marginBottom: Theme.spacing.xs,
  },
  calories: {
    fontSize: Theme.fontSizes.md,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.white,
  },
});

export default CaloriesCalculator;

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Theme } from '../../lib/theme';

const { width } = Dimensions.get('window');
const BAR_WIDTH = width / 10;

const days = ['m', 't', 'w', 't', 'f', 's', 's'];
const exampleData = [80, 50, 100, 70, 20, 40, 60]; // À remplacer plus tard par des données Firebase
const maxValue = 100;

type BarProps = {
  value: number;
  day: string;
  highlight: boolean;
};

const Bar: React.FC<BarProps> = ({ value, day, highlight }) => {
  const height = useSharedValue(0);

  useEffect(() => {
    height.value = withTiming((value / maxValue) * 150, { duration: 800 });
  }, [value]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    backgroundColor: highlight ? Theme.colors.primary : Theme.colors.secondary,
  }));

  return (
    <View style={styles.barContainer}>
      <Animated.View style={[styles.bar, animatedStyle]} />
      <Text style={styles.dayLabel}>{day}</Text>
    </View>
  );
};

const WeeklyChart: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.chart}>
        {exampleData.map((val, index) => (
          <Bar
            key={index}
            value={val}
            day={days[index]}
            highlight={index === 2} // Mettre mercredi (index 2) en surbrillance
          />
        ))}
      </View>
      <Text style={styles.weekText}>week of 29 July</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.background,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.paddings.lg,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 200,
    marginBottom: Theme.spacing.sm,
  },
  barContainer: {
    alignItems: 'center',
    marginHorizontal: Theme.spacing.xs / 2,
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: Theme.radii.sm,
  },
  dayLabel: {
    color: Theme.colors.white,
    fontSize: Theme.fontSizes.sm,
    fontFamily: Theme.fonts.medium,
    marginTop: Theme.spacing.xxs,
  },
  weekText: {
    color: Theme.colors.white,
    fontSize: Theme.fontSizes.md,
    fontFamily: Theme.fonts.semiBold,
    marginTop: Theme.spacing.sm,
  },
});

export default WeeklyChart;
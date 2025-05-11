import React from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Theme } from '../../lib/theme';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const BAR_WIDTH = width / 10;
const daysLabels = ['l', 'm', 'm', 'j', 'v', 's', 'd']; // lundi à dimanche

type ActivityDay = { steps: number; calories: number; distance: number };

// Trouver le lundi de la semaine courante
function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 0 (dimanche) -> lundi précédent
  return new Date(d.setHours(0,0,0,0)).setDate(diff);
}

// Générer les 7 jours de la semaine à partir du lundi
function getWeekDates(date: Date) {
  const monday = new Date(getMonday(date));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

// Hook personnalisé pour récupérer l'activité hebdomadaire
function useWeeklyActivity(weekRef: Date) {
  const [weeklyData, setWeeklyData] = React.useState<ActivityDay[] | null>(null);
  const [weekStart, setWeekStart] = React.useState<Date | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    async function fetchWeeklyActivity(userId: string): Promise<ActivityDay[]> {
      const weekDates = getWeekDates(weekRef);
      setWeekStart(weekDates[0]);
      return Promise.all(
        weekDates.map(async (date) => {
          const key = date.toISOString().split('T')[0];
          const ref = doc(db, 'users', userId, 'activities', key);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data();
            return { steps: data.steps || 0, calories: data.calories || 0, distance: data.distance || 0 };
          }
          return { steps: 0, calories: 0, distance: 0 };
        })
      );
    }

    if (!auth.currentUser) {
      setWeeklyData(null);
      setWeekStart(null);
      setLoading(false);
      setError('Utilisateur non connecté');
      return;
    }
    setLoading(true);
    setError('');
    fetchWeeklyActivity(auth.currentUser.uid)
      .then((data) => setWeeklyData(data))
      .catch(() => setError('Erreur de récupération'))
      .finally(() => setLoading(false));
  }, [auth.currentUser, weekRef]);

  return { weeklyData, weekStart, loading, error };
}

type BarProps = {
  value: number;
  day: string;
  highlight: boolean;
  maxSteps: number;
  isMax: boolean;
};

const Bar: React.FC<BarProps> = ({ value, day, highlight, maxSteps, isMax }) => {
  const height = useSharedValue(0);

  React.useEffect(() => {
    height.value = withTiming((value / (maxSteps || 1)) * 150, { duration: 800 });
  }, [value, maxSteps]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    backgroundColor: isMax ? Theme.colors.primary : Theme.colors.secondary,
  }));

  return (
    <View style={styles.barContainer}>
      <Text style={styles.stepsLabel}>{value}</Text>
      <Animated.View style={[styles.bar, animatedStyle]} />
      <Text style={styles.dayLabel}>{day}</Text>
    </View>
  );
};

const WeeklyChart: React.FC = () => {
  // State pour la navigation entre les semaines
  const [weekRef, setWeekRef] = React.useState(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return today;
  });
  const { weeklyData, weekStart, loading, error } = useWeeklyActivity(weekRef);

  // Pour désactiver la flèche droite si on est sur la semaine courante
  const isCurrentWeek = (() => {
    const now = new Date();
    const mondayNow = new Date(getMonday(now));
    const mondayRef = new Date(getMonday(weekRef));
    return mondayNow.getTime() === mondayRef.getTime();
  })();

  const goToPrevWeek = () => {
    setWeekRef(prev => {
      const d = new Date(getMonday(prev));
      d.setDate(d.getDate() - 7);
      return d;
    });
  };
  const goToNextWeek = () => {
    if (isCurrentWeek) return;
    setWeekRef(prev => {
      const d = new Date(getMonday(prev));
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}> 
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'red' }}>{error}</Text>
      </View>
    );
  }
  if (!weeklyData) {
    return (
      <View style={styles.container}>
        <Text>Aucune donnée</Text>
      </View>
    );
  }

  const maxSteps = Math.max(...weeklyData.map((d) => d.steps), 1);
  const totalCalories = weeklyData.reduce((sum, d) => sum + d.calories, 0);
  const totalDistance = weeklyData.reduce((sum, d) => sum + d.distance, 0);
  const maxIndexes = weeklyData
    .map((d, i) => ({ steps: d.steps, i }))
    .filter(d => d.steps === maxSteps)
    .map(d => d.i);

  return (
    <View style={styles.container}>
      {/* Titre principal très stylé */}
      <View style={styles.titleWrapper}>
        <Text style={styles.title}>Historique hebdomadaire</Text>
        <View style={styles.titleUnderline} />
      </View>
      <View style={styles.chart}>
        {weeklyData.map((val, index) => (
          <Bar
            key={index}
            value={val.steps}
            day={daysLabels[index]}
            highlight={index === 2}
            maxSteps={maxSteps}
            isMax={maxIndexes.includes(index)}
          />
        ))}
      </View>
      {/* Navigation semaine sous le graphe */}
      <View style={styles.weekNavRow}>
        <TouchableOpacity onPress={goToPrevWeek} style={styles.arrowBtn}>
          <Ionicons name="chevron-back" size={28} color={Theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.weekText}>
          Semaine du {weekStart ? weekStart.toLocaleDateString() : ''}
        </Text>
        <TouchableOpacity onPress={goToNextWeek} style={styles.arrowBtn} disabled={isCurrentWeek}>
          <Ionicons name="chevron-forward" size={28} color={isCurrentWeek ? Theme.colors.secondary : Theme.colors.white} />
        </TouchableOpacity>
      </View>
      <View style={{ marginTop: Theme.spacing.md, alignItems: 'center' }}>
        <Text style={styles.dataText}>Total Calories: {totalCalories} kcal</Text>
        <Text style={styles.dataText}>Total Distance: {totalDistance.toFixed(2)} km</Text>
      </View>
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
  weekNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  arrowBtn: {
    padding: 8,
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
    marginHorizontal: 12,
  },
  dataText: {
    color: Theme.colors.white,
    fontSize: Theme.fontSizes.sm,
    fontFamily: Theme.fonts.medium,
    marginTop: 2,
  },
  stepsLabel: {
    color: Theme.colors.white,
    fontSize: Theme.fontSizes.sm,
    fontFamily: Theme.fonts.semiBold,
    marginBottom: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  titleWrapper: {
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
    alignItems: 'center',
  },
  title: {
    color: Theme.colors.primary,
    fontSize: Theme.fontSizes.xl ,
    fontFamily: Theme.fonts.bold,
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  titleUnderline: {
    width: 80,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.primary,
    opacity: 0.25,
    marginTop: 0,
  },
});

export default WeeklyChart;
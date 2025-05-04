import React from "react";
import { View, Dimensions, Text, StyleSheet } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Theme } from "../../lib/theme";

interface ActivityData {
  date: string;
  steps: number;
}

interface ActivityChartsProps {
  data: ActivityData[];
}

const ActivityCharts: React.FC<ActivityChartsProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Aucune donnée disponible</Text>
      </View>
    );
  }

  const chartData = {
    labels: data.map(item => item.date.split('-').reverse().slice(0, 2).join('/')),
    datasets: [{
      data: data.map(item => item.steps),
      color: (opacity = 1) => `rgba(252, 163, 17, ${opacity})`,
      strokeWidth: 2
    }]
  };

  return (
    <LineChart
      data={chartData}
      width={Dimensions.get('window').width - 40}
      height={220}
      chartConfig={{
        backgroundColor: Theme.colors.dark,
        backgroundGradientFrom: "#333333",
        backgroundGradientTo: "#1e1e1e",
        decimalPlaces: 0,
        color: () => Theme.colors.primary,
        labelColor: () => Theme.colors.white,
        style: { borderRadius: 16 }
      }}
      bezier
    />
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    color: Theme.colors.white,
    fontSize: 16
  }
});

export default ActivityCharts;
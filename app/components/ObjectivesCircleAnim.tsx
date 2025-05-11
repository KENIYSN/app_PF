import React from 'react';
import { Dimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.5;
const STROKE_WIDTH = 12;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  progress: Animated.SharedValue<number>;
  color?: string;
}

export const AnimatedProgressCircle: React.FC<Props> = ({ progress, color = '#FFA500' }) => {
  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = CIRCUMFERENCE * (1 - progress.value);
    return {
      strokeDashoffset,
    };
  });

  return (
    <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
      <Circle
        stroke="#E0E0E0"
        fill="none"
        cx={CIRCLE_SIZE / 2}
        cy={CIRCLE_SIZE / 2}
        r={RADIUS}
        strokeWidth={STROKE_WIDTH}
      />
      <AnimatedCircle
        stroke={color}
        fill="none"
        cx={CIRCLE_SIZE / 2}
        cy={CIRCLE_SIZE / 2}
        r={RADIUS}
        strokeWidth={STROKE_WIDTH}
        strokeDasharray={`${CIRCUMFERENCE}, ${CIRCUMFERENCE}`}
        strokeLinecap="round"
        animatedProps={animatedProps}
      />
    </Svg>
  );
};

export { CIRCLE_SIZE };

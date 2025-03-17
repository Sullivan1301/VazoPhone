import { View, StyleSheet } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

type PlaybackSliderProps = {
  position: number;
  duration: number;
  onSeek: (position: number) => void;
};

export function PlaybackSlider({ position, duration, onSeek }: PlaybackSliderProps) {
  const progress = useSharedValue(0);
  
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startX = progress.value;
    },
    onActive: (event, ctx) => {
      const newProgress = ctx.startX + event.translationX;
      progress.value = Math.max(0, Math.min(newProgress, 1));
    },
    onEnd: () => {
      onSeek(progress.value * duration);
    },
  });

  const sliderStyle = useAnimatedStyle(() => {
    return {
      width: `${(position / duration) * 100}%`,
      backgroundColor: '#6366F1',
    };
  });

  return (
    <View style={styles.container}>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.slider, sliderStyle]} />
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  slider: {
    height: '100%',
    borderRadius: 2,
  },
});
import { View, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

type PlaybackSliderProps = {
  position: number;
  duration: number;
  onSeek: (position: number) => void;
};

export function PlaybackSlider({ position, duration, onSeek }: PlaybackSliderProps) {
  const progress = useSharedValue(position / duration);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      // On commence le geste
    })
    .onUpdate((event) => {
      progress.value = Math.max(0, Math.min(event.translationX / 200, 1)); // Normalisation
    })
    .onEnd(() => {
      onSeek(progress.value * duration);
    });

  const sliderStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
    backgroundColor: '#6366F1',
  }));

  return (
    <View style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.slider, sliderStyle]} />
      </GestureDetector>
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

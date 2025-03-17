import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Play, SkipBack, SkipForward, Pause } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { PlaybackSlider } from '@/components/PlaybackSlider';
import { router, useLocalSearchParams } from 'expo-router';

export default function PlayerScreen() {
  const { trackId } = useLocalSearchParams();
  const { playbackState, togglePlayback, seekTo } = useAudioPlayer();

  const formatTime = (millis: number) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <BlurView intensity={100} tint="dark" style={styles.container}>
      <View style={styles.content}>
        <View style={styles.albumArt}>
          <Text style={styles.placeholder}>🎵</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.title}>
            {playbackState.currentTrack?.filename || 'No Track Selected'}
          </Text>
          <Text style={styles.artist}>Unknown Artist</Text>
        </View>

        <View style={styles.progressContainer}>
          <PlaybackSlider
            position={playbackState.currentPosition}
            duration={playbackState.duration}
            onSeek={seekTo}
          />
          <View style={styles.timeInfo}>
            <Text style={styles.timeText}>
              {formatTime(playbackState.currentPosition)}
            </Text>
            <Text style={styles.timeText}>
              {formatTime(playbackState.duration)}
            </Text>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton}>
            <SkipBack color="#FFFFFF" size={24} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlButton, styles.playButton]}
            onPress={togglePlayback}
          >
            {playbackState.isPlaying ? (
              <Pause color="#FFFFFF" size={32} />
            ) : (
              <Play color="#FFFFFF" size={32} />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton}>
            <SkipForward color="#FFFFFF" size={24} />
          </TouchableOpacity>
        </View>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  albumArt: {
    width: 280,
    height: 280,
    backgroundColor: '#333',
    borderRadius: 20,
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    fontSize: 80,
  },
  info: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  artist: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 40,
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  controlButton: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366F1',
  },
});
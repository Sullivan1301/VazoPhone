import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type PlaybackState = {
  isPlaying: boolean;
  currentTrack: MediaLibrary.Asset | null;
  currentPosition: number;
  duration: number;
  playbackInstance: Audio.Sound | null;
};

export function useAudioPlayer() {
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTrack: null,
    currentPosition: 0,
    duration: 0,
    playbackInstance: null,
  });

  useEffect(() => {
    setupAudio();
    if (Platform.OS !== 'web') {
      setupNotifications();
    }
    return () => {
      if (playbackState.playbackInstance) {
        playbackState.playbackInstance.unloadAsync();
      }
    };
  }, []);

  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  };

  const setupNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  };

  const loadAudio = async (track: MediaLibrary.Asset) => {
    try {
      if (playbackState.playbackInstance) {
        await playbackState.playbackInstance.unloadAsync();
      }

      const { sound, status } = await Audio.Sound.createAsync(
        { uri: track.uri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      setPlaybackState(prev => ({
        ...prev,
        currentTrack: track,
        playbackInstance: sound,
        isPlaying: true,
        duration: status.durationMillis || 0,
      }));

      if (Platform.OS !== 'web') {
        showPlaybackNotification(track);
      }
    } catch (error) {
      console.error('Error loading audio:', error);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPlaybackState(prev => ({
        ...prev,
        isPlaying: status.isPlaying,
        currentPosition: status.positionMillis,
        duration: status.durationMillis,
      }));
    }
  };

  const showPlaybackNotification = async (track: MediaLibrary.Asset) => {
    if (Platform.OS === 'web') return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: track.filename,
        body: 'Now Playing',
        data: { trackId: track.id },
      },
      trigger: null,
    });
  };

  const togglePlayback = async () => {
    if (!playbackState.playbackInstance) return;

    if (playbackState.isPlaying) {
      await playbackState.playbackInstance.pauseAsync();
    } else {
      await playbackState.playbackInstance.playAsync();
    }
  };

  const seekTo = async (position: number) => {
    if (!playbackState.playbackInstance) return;
    await playbackState.playbackInstance.setPositionAsync(position);
  };

  return {
    playbackState,
    loadAudio,
    togglePlayback,
    seekTo,
  };
}
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Button,
  ActivityIndicator,
  Modal,
  Image,
  Alert,
  Platform,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { Audio } from 'expo-av';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Tâche en arrière-plan pour Android
const BACKGROUND_TASK = 'audio-background-task';
TaskManager.defineTask(BACKGROUND_TASK, () => {
  return new Promise(resolve => {
    resolve({
      success: true,
      data: { alive: true },
    });
  });
});

export default function LibraryScreen() {
  const [songs, setSongs] = useState<MediaLibrary.Asset[]>([]);
  const [permission, setPermission] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentSong, setCurrentSong] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [metadata, setMetadata] = useState({
    title: '',
    artist: '',
    artwork: null as string | null,
  });
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showDetail, setShowDetail] = useState(false);
  const mediaSession = useRef<MediaLibrary.MediaSession | null>(null);

  // Configuration initiale
  useEffect(() => {
    const setupAudio = async () => {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });

      if (Platform.OS === 'android') {
        await TaskManager.registerTaskAsync(BACKGROUND_TASK, {
          name: BACKGROUND_TASK,
          options: {
            priority: TaskManager.TaskManagerBackgroundTaskPriority.HIGH,
          },
        });
        await TaskManager.startTaskAsync(BACKGROUND_TASK);
      }

      checkPermissionAndLoadSongs();
    };

    setupAudio();

    return () => {
      if (sound) sound.unloadAsync();
      if (mediaSession.current) mediaSession.current.release();
    };
  }, []);

  // Gestion de la session média (écran verrouillé)
  const setupMediaSession = async () => {
    if (Platform.OS === 'android') {
      mediaSession.current = await MediaLibrary.createMediaSessionAsync();

      mediaSession.current.setOnPlay(() => togglePlayback());
      mediaSession.current.setOnPause(() => togglePlayback());
      mediaSession.current.setOnSkipToNext(() => handleNext());
      mediaSession.current.setOnSkipToPrevious(() => handlePrevious());
    }
  };

  // Mise à jour des métadonnées pour l'écran verrouillé
  const updateMediaSession = async () => {
    if (mediaSession.current) {
      await mediaSession.current.setMetadataAsync({
        title: metadata.title,
        artist: metadata.artist,
        artwork: metadata.artwork,
        duration: duration * 1000,
      });
      await mediaSession.current.setPlaybackState({
        position: position * 1000,
        state: isPlaying ? 'playing' : 'paused',
      });
    }
  };

  // Lecture d'une musique
  const playSound = async (index: number) => {
    if (index < 0 || index >= songs.length) return;

    try {
      if (sound) await sound.unloadAsync();

      const song = songs[index];
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: song.uri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setPosition(status.positionMillis / 1000);
            setDuration(status.durationMillis / 1000);
            if (status.didJustFinish) handleNext();
          }
        }
      );

      const meta = await getMetadata(song.id);
      setMetadata(meta);

      setSound(newSound);
      setCurrentSong(song.id);
      setCurrentIndex(index);
      setIsPlaying(true);

      await setupMediaSession();
      await updateMediaSession();

    } catch (error) {
      Alert.alert('Erreur', 'Lecture impossible');
    }
  };

  // Play/Pause
  const togglePlayback = async () => {
    if (!sound) return;

    if (isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
    } else {
      await sound.playAsync();
      setIsPlaying(true);
    }

    await updateMediaSession();
  };

  // Reste du code inchangé...
  // (handleNext, handlePrevious, formatDuration, etc.)

  return (
    <View style={styles.container}>
      {/* Interface utilisateur existante */}
    </View>
  );
}

const styles = StyleSheet.create({
  // Styles existants
});
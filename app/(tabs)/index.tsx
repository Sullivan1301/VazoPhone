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

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const BACKGROUND_TASK = 'audio-background-task';
TaskManager.defineTask(BACKGROUND_TASK, () => {
  return new Promise(resolve => {
    resolve({ success: true, data: { alive: true } });
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

  useEffect(() => {
    const setup = async () => {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });

      if (Platform.OS === 'android') {
        await TaskManager.registerTaskAsync(BACKGROUND_TASK, {
          name: BACKGROUND_TASK,
          options: { priority: TaskManager.TaskManagerBackgroundTaskPriority.HIGH },
        });
        await TaskManager.startTaskAsync(BACKGROUND_TASK);
      }

      checkPermissionAndLoadSongs();
      configureNotifications();
    };

    setup();

    return () => {
      if (sound) sound.unloadAsync();
      if (mediaSession.current) mediaSession.current.release();
    };
  }, []);

  const checkPermissionAndLoadSongs = async () => {
    setLoading(true);
    const { status } = await MediaLibrary.requestPermissionsAsync();
    setPermission(status === 'granted');
    if (status === 'granted') await loadSongs();
    setLoading(false);
  };

  const loadSongs = async () => {
    try {
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.audio,
        first: 100,
      });
      setSongs(media.assets);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les musiques');
    }
  };

  const getMetadata = async (id: string) => {
    try {
      const assetInfo = await MediaLibrary.getAssetInfoAsync(id);
      return {
        title: assetInfo.filename || 'Inconnu',
        artist: assetInfo.artist || 'Artiste inconnu',
        artwork: assetInfo.artwork?.localUri || null,
      };
    } catch (error) {
      return { title: 'Inconnu', artist: 'Artiste inconnu', artwork: null };
    }
  };

  const configureNotifications = async () => {
    await Notifications.setNotificationCategoryAsync('music_controls', [
      { identifier: 'play_pause', buttonTitle: isPlaying ? 'Pause' : 'Play' },
      { identifier: 'next', buttonTitle: 'Suivant' },
      { identifier: 'previous', buttonTitle: 'Précédent' },
    ]);
  };

  const updateNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: metadata.title,
        body: metadata.artist,
        sound: false,
        categoryIdentifier: 'music_controls',
        data: { songId: currentSong },
      },
      trigger: null,
    });
  };

  const handleNotificationAction = (action: string) => {
    switch (action) {
      case 'play_pause': togglePlayback(); break;
      case 'next': handleNext(); break;
      case 'previous': handlePrevious(); break;
    }
  };

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => handleNotificationAction(response.actionIdentifier)
    );
    return () => subscription.remove();
  }, [isPlaying, currentIndex]);

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
      await updateNotification();

    } catch (error) {
      Alert.alert('Erreur', 'Lecture impossible');
    }
  };

  const togglePlayback = async () => {
    if (!sound) return;
    try {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
      await updateNotification();
    } catch (error) {
      console.error('Erreur togglePlayback', error);
    }
  };

  const handleNext = () => {
    if (currentIndex === null) return;
    const newIndex = currentIndex < songs.length - 1 ? currentIndex + 1 : 0;
    playSound(newIndex);
  };

  const handlePrevious = () => {
    if (currentIndex === null) return;
    const newIndex = currentIndex > 0 ? currentIndex - 1 : songs.length - 1;
    playSound(newIndex);
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds < 0) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Permission requise</Text>
        <Text style={styles.text}>Veuillez accorder l'accès à votre bibliothèque musicale.</Text>
        <Button title="Autoriser l'accès" onPress={checkPermissionAndLoadSongs} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bibliothèque Musicale</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#6366F1" />
      ) : (
        <>
          <Button title="Actualiser" onPress={loadSongs} />
          <FlatList
            data={songs}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={styles.songItem}
                onPress={() => playSound(index)}
              >
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle}>{item.filename}</Text>
                  <Text style={styles.songDuration}>{formatDuration(item.duration || 0)}</Text>
                </View>
                {currentSong === item.id && (isPlaying ?
                  <Pause color="#FF0000" size={24} /> :
                  <Play color="#6366F1" size={24} />
                )}
              </TouchableOpacity>
            )}
          />
        </>
      )}

      {currentIndex !== null && (
        <>
          <TouchableOpacity
            style={styles.currentSongBar}
            onPress={() => setShowDetail(true)}
          >
            <Text style={styles.currentSongTitle}>{metadata.title}</Text>
            <Text style={styles.currentSongArtist}>{metadata.artist}</Text>
          </TouchableOpacity>

          <View style={styles.controls}>
            <View style={styles.progressContainer}>
              <Text style={styles.timeText}>{formatDuration(position)}</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={duration}
                value={position}
                onSlidingComplete={async (value) => await sound?.setPositionAsync(value * 1000)}
                minimumTrackTintColor="#FFFFFF"
                maximumTrackTintColor="#666666"
                thumbTintColor="#FFFFFF"
              />
              <Text style={styles.timeText}>{formatDuration(duration)}</Text>
            </View>

            <View style={styles.controlButtons}>
              <TouchableOpacity onPress={handlePrevious}>
                <SkipBack color="#FFFFFF" size={32} />
              </TouchableOpacity>

              <TouchableOpacity onPress={togglePlayback} style={styles.playButton}>
                {isPlaying ? <Pause color="#FFFFFF" size={40} /> : <Play color="#FFFFFF" size={40} />}
              </TouchableOpacity>

              <TouchableOpacity onPress={handleNext}>
                <SkipForward color="#FFFFFF" size={32} />
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      <Modal visible={showDetail} animationType="slide">
        <View style={styles.modalContainer}>
          {metadata.artwork ? (
            <Image source={{ uri: metadata.artwork }} style={styles.artwork} />
          ) : (
            <View style={styles.artworkPlaceholder} />
          )}

          <Text style={styles.detailTitle}>{metadata.title}</Text>
          <Text style={styles.detailArtist}>{metadata.artist}</Text>

          <View style={styles.progressContainer}>
            <Text style={styles.timeText}>{formatDuration(position)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={duration}
              value={position}
              onSlidingComplete={async (value) => await sound?.setPositionAsync(value * 1000)}
              minimumTrackTintColor="#FFFFFF"
              maximumTrackTintColor="#9CA3AF"
              thumbTintColor="#FFFFFF"
            />
            <Text style={styles.timeText}>{formatDuration(duration)}</Text>
          </View>

          <View style={styles.controlButtons}>
            <TouchableOpacity onPress={handlePrevious}>
              <SkipBack color="#FFFFFF" size={32} />
            </TouchableOpacity>

            <TouchableOpacity onPress={togglePlayback}>
              {isPlaying ? <Pause color="#FF0000" size={40} /> : <Play color="#FFFFFF" size={40} />}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleNext}>
              <SkipForward color="#FFFFFF" size={32} />
            </TouchableOpacity>
          </View>

          <Button title="Fermer" onPress={() => setShowDetail(false)} />
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    marginVertical: 10,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  songInfo: {
    flex: 1,
    marginRight: 15,
  },
  songTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  songDuration: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  controls: {
    backgroundColor: '#00000050',
    paddingVertical: 20,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  playButton: {
    marginHorizontal: 30,
  },
  currentSongBar: {
    backgroundColor: '#333333',
    padding: 15,
    borderRadius: 8,
    margin: 10,
  },
  currentSongTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  currentSongArtist: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    padding: 20,
    justifyContent: 'center',
  },
  artwork: {
    width: 300,
    height: 300,
    borderRadius: 10,
    marginBottom: 30,
    alignSelf: 'center',
  },
  artworkPlaceholder: {
    width: 300,
    height: 300,
    backgroundColor: '#333',
    borderRadius: 10,
    marginBottom: 30,
    alignSelf: 'center',
  },
  detailTitle: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  detailArtist: {
    fontSize: 24,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  timeText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Inter-Regular',
    minWidth: 50,
    textAlign: 'center',
  },
});

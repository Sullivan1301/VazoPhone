import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { Audio } from 'expo-av';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react-native';
import Slider from '@react-native-community/slider';

export default function LibraryScreen() {
  const [songs, setSongs] = useState<MediaLibrary.Asset[]>([]);
  const [permission, setPermission] = useState<boolean>(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentSong, setCurrentSong] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [metadata, setMetadata] = useState<{
    title: string;
    artist: string;
    artwork?: string | null;
  }>({
    title: '',
    artist: '',
    artwork: null,
  });
  const [position, setPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [showDetail, setShowDetail] = useState<boolean>(false);

  useEffect(() => {
    checkPermissionAndLoadSongs();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const checkPermissionAndLoadSongs = async () => {
    setLoading(true);
    const { status, canAskAgain } = await MediaLibrary.getPermissionsAsync();

    if (status !== 'granted' && canAskAgain) {
      const { status: newStatus } = await MediaLibrary.requestPermissionsAsync();
      setPermission(newStatus === 'granted');
    } else {
      setPermission(status === 'granted');
    }

    if (permission) {
      await loadSongs();
    }
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
      console.error('Erreur chargement audio :', error);
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
      console.error('Erreur métadonnées :', error);
      return { title: 'Inconnu', artist: 'Artiste inconnu', artwork: null };
    }
  };

  const playSound = async (index: number) => {
    if (index < 0 || index >= songs.length) return;

    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

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

    } catch (error) {
      console.error('Erreur lecture :', error);
      Alert.alert('Erreur', 'Impossible de lire ce fichier audio');
    }
  };

  const togglePlayback = async () => {
    if (!sound) return;

    if (isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
    } else {
      await sound.playAsync();
      setIsPlaying(true);
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
        <Text style={styles.text}>
          Veuillez accorder l'accès à votre bibliothèque musicale.
        </Text>
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
                  <Text style={styles.songDuration}>
                    {formatDuration(item.duration || 0)}
                  </Text>
                </View>
                {currentSong === item.id ? (
                  isPlaying ? (
                    <Pause color="#FF0000" size={24} />
                  ) : (
                    <Play color="#6366F1" size={24} />
                  )
                ) : null}
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
                onSlidingComplete={async (value) => {
                  await sound?.setPositionAsync(value * 1000);
                }}
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
                {isPlaying ? (
                  <Pause color="#FFFFFF" size={40} />
                ) : (
                  <Play color="#FFFFFF" size={40} />
                )}
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
              // ... mêmes props que précédemment
            />
            <Text style={styles.timeText}>{formatDuration(duration)}</Text>
          </View>

          <View style={styles.controlButtons}>
            {/* Contrôles identiques à la vue principale */}
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
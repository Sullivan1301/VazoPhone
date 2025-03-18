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
  }, []);

  const checkPermissionAndLoadSongs = async () => {
    setLoading(true);
    const { status } = await MediaLibrary.requestPermissionsAsync();
    setPermission(status === 'granted');

    if (status === 'granted') {
      await loadSongs();
    }
    setLoading(false);
  };

  const loadSongs = async () => {
    try {
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.audio,
        first: 1000,
      });
      setSongs(media.assets);
    } catch (error) {
      console.error('Erreur lors du chargement des fichiers audio :', error);
    }
  };

  const getMetadata = async (
    uri: string
  ): Promise<{ title: string; artist: string; artwork?: string | null }> => {
    try {
      const { sound: tempSound } = await Audio.Sound.createAsync({ uri });
      const status = await tempSound.getStatusAsync();
      await tempSound.unloadAsync();

      const meta = (status as any).metadata;
      if (meta) {
        return {
          title: meta.title || 'Inconnu',
          artist: meta.artist || 'Artiste inconnu',
          artwork: meta.artwork || null,
        };
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des métadonnées :', error);
    }
    return { title: 'Inconnu', artist: 'Artiste inconnu', artwork: null };
  };

  const playSound = async (index: number) => {
    if (index < 0 || index >= songs.length) return;

    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }

      const song = songs[index];
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: song.uri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setCurrentSong(song.id);
      setCurrentIndex(index);
      setIsPlaying(true);
      setPosition(0); // Réinitialiser la position à 0

      const meta = await getMetadata(song.uri);
      setMetadata(meta);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.positionMillis !== undefined) {
            setPosition(status.positionMillis / 1000);
          }
          if (status.durationMillis !== undefined) {
            setDuration(status.durationMillis / 1000);
          }
          if (status.didJustFinish) {
            handleNext();
          }
        }
      });
    } catch (error) {
      console.error('Erreur lors de la lecture du son :', error);
    }
  };

  const togglePlayback = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    }
  };

  const handleNext = () => {
    if (currentIndex !== null && currentIndex < songs.length - 1) {
      playSound(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex !== null && currentIndex > 0) {
      playSound(currentIndex - 1);
    }
  };

  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Permission requise</Text>
        <Text style={styles.text}>
          Veuillez accorder l'accès à votre bibliothèque pour utiliser VazoPhone.
        </Text>
        <Button title="Accorder l'accès" onPress={checkPermissionAndLoadSongs} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Votre Bibliothèque</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#6366F1" />
      ) : (
        <>
          <Button title="Recharger la liste" onPress={loadSongs} />
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
                    {formatDuration(item.duration)}
                  </Text>
                </View>
                {currentSong === item.id && isPlaying ? (
                  <Pause color="#FF0000" size={24} />
                ) : (
                  <Play color="#6366F1" size={24} />
                )}
              </TouchableOpacity>
            )}
          />
        </>
      )}

      {/* Contrôles de lecture et barre de progression */}
      {currentIndex !== null && (
        <View style={styles.controls}>
          <View style={styles.progressContainer}>
            <Text style={styles.timeText}>{formatDuration(position)}</Text>
            <Text style={styles.timeText}>{formatDuration(duration)}</Text>
          </View>

          <View style={styles.controlButtons}>
            <TouchableOpacity
              onPress={handlePrevious}
              style={styles.controlButton}
            >
              <SkipBack color="#FFFFFF" size={32} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={togglePlayback}
              style={styles.controlButton}
            >
              {isPlaying ? (
                <Pause color="#FF0000" size={40} />
              ) : (
                <Play color="#FFFFFF" size={40} />
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleNext} style={styles.controlButton}>
              <SkipForward color="#FFFFFF" size={32} />
            </TouchableOpacity>
          </View>

          {/* Afficher la chanson suivante */}
          {currentIndex < songs.length - 1 && (
            <Text style={styles.nextSong}>
              Next: {songs[currentIndex + 1].filename}
            </Text>
          )}
        </View>
      )}

      {/* Barre affichant les métadonnées du morceau courant et ouvrant le détail */}
      {currentIndex !== null && (
        <TouchableOpacity
          style={styles.currentSongBar}
          onPress={() => setShowDetail(true)}
        >
          <Text style={styles.currentSongTitle}>{metadata.title}</Text>
          <Text style={styles.currentSongArtist}>{metadata.artist}</Text>
        </TouchableOpacity>
      )}

      {/* Modal pour la vue détaillée */}
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
                    style={{ flex: 1, marginHorizontal: 10 }}
                    minimumValue={0}
                    maximumValue={duration}          
                  value={position}                  
                   minimumTrackTintColor="#FFFFFF"
                    maximumTrackTintColor="#9CA3AF"
                   thumbTintColor="#FFFFFF"
                 onValueChange={(value) => {
      
      setPosition(value);
    }}
    onSlidingComplete={async (value) => {
      
      if (sound) {
        await sound.setPositionAsync(value * 1000);
      }
    }}
  />
            <Text style={styles.timeText}>{formatDuration(duration)}</Text>
          </View>

          <View style={styles.controls}>
  <View style={styles.controlButtons}>
    <TouchableOpacity onPress={handlePrevious} style={styles.controlButton}>
      <SkipBack color="#FFFFFF" size={32} />
    </TouchableOpacity>

    <TouchableOpacity onPress={togglePlayback} style={styles.controlButton}>
      {isPlaying ? (
        <Pause color="#FF0000" size={40} />
      ) : (
        <Play color="#FFFFFF" size={40} />
      )}
    </TouchableOpacity>

    <TouchableOpacity onPress={handleNext} style={styles.controlButton}>
      <SkipForward color="#FFFFFF" size={32} />
    </TouchableOpacity>
  </View>
</View>


          {/* Afficher la chanson suivante dans le Modal */}
          {currentIndex !== null && currentIndex < songs.length - 1 && (
            <Text style={styles.nextSong}>
              Next: {songs[currentIndex + 1].filename}
            </Text>
          )}

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
  },
  text: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
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
  },
  songTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  songDuration: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  controls: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  controlButton: {
    marginHorizontal: 20,
  },
  currentSongBar: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
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
    paddingTop: 60,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artwork: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  artworkPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 10,
    backgroundColor: '#333',
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  detailArtist: {
    fontSize: 20,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginBottom: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    width: '100%',
  },
  timeText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    marginHorizontal: 10,
  },
  nextSong: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginTop: 10,
    textAlign: 'center',
  },
});
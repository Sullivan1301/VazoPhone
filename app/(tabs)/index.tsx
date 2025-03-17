import { View, Text, StyleSheet, FlatList, TouchableOpacity, Button, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import * as MediaLibrary from 'expo-media-library';
import { Audio } from 'expo-av';
import { Play, Pause } from 'lucide-react-native';

export default function LibraryScreen() {
  const [songs, setSongs] = useState<MediaLibrary.Asset[]>([]);
  const [permission, setPermission] = useState<boolean>(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentSong, setCurrentSong] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

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
        first: 1000, // Charger plus de fichiers si nécessaire
      });
      setSongs(media.assets);
    } catch (error) {
      console.error('Erreur lors du chargement des fichiers audio :', error);
    }
  };

  const playSound = async (song: MediaLibrary.Asset) => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: song.uri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setCurrentSong(song.id);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          setCurrentSong(null);
        }
      });
    } catch (error) {
      console.error('Erreur lors de la lecture du son :', error);
    }
  };

  const togglePlayback = async (song: MediaLibrary.Asset) => {
    if (currentSong === song.id && sound) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } else {
      playSound(song);
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
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.songItem}
                onPress={() => togglePlayback(item)}
              >
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle}>{item.filename}</Text>
                  <Text style={styles.songDuration}>{formatDuration(item.duration)}</Text>
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
});

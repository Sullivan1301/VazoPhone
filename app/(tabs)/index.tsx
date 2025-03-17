import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import * as MediaLibrary from 'expo-media-library';
import { router } from 'expo-router';
import { Play } from 'lucide-react-native';

export default function LibraryScreen() {
  const [songs, setSongs] = useState<MediaLibrary.Asset[]>([]);
  const [permission, setPermission] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setPermission(status === 'granted');

      if (status === 'granted') {
        const media = await MediaLibrary.getAssetsAsync({
          mediaType: 'audio',
        });
        setSongs(media.assets);
      }
    })();
  }, []);

  const handleSongPress = (song: MediaLibrary.Asset) => {
    router.push({
      pathname: '/player',
      params: { trackId: song.id }
    });
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Permission Required</Text>
        <Text style={styles.text}>
          Please grant access to your media library to use VazoPhone.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Library</Text>
      <FlatList
        data={songs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.songItem}
            onPress={() => handleSongPress(item)}
          >
            <View style={styles.songInfo}>
              <Text style={styles.songTitle}>{item.filename}</Text>
              <Text style={styles.songDuration}>
                {Math.round(item.duration)} seconds
              </Text>
            </View>
            <Play color="#6366F1" size={24} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    paddingHorizontal: 20,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginHorizontal: 20,
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
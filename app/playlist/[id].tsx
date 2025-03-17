import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { usePlaylistManager } from '@/hooks/usePlaylistManager';
import { Play, ArrowLeft, Trash2 } from 'lucide-react-native';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

export default function PlaylistScreen() {
  const { id } = useLocalSearchParams();
  const { playlists, removeTrackFromPlaylist } = usePlaylistManager();
  const { loadAudio } = useAudioPlayer();

  const playlist = playlists.find(p => p.id === id);

  if (!playlist) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Playlist not found</Text>
      </View>
    );
  }

  const handleTrackPress = async (track: any) => {
    await loadAudio(track);
    router.push('/player');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft color="#FFFFFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>{playlist.name}</Text>
      </View>

      <FlatList
        data={playlist.tracks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.trackItem}>
            <TouchableOpacity 
              style={styles.trackInfo}
              onPress={() => handleTrackPress(item)}
            >
              <Text style={styles.trackTitle}>{item.filename}</Text>
              <Text style={styles.trackDuration}>
                {Math.round(item.duration)} seconds
              </Text>
            </TouchableOpacity>
            <View style={styles.trackActions}>
              <TouchableOpacity
                onPress={() => removeTrackFromPlaylist(playlist.id, item.id)}
              >
                <Trash2 color="#9CA3AF" size={20} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleTrackPress(item)}>
                <Play color="#6366F1" size={24} />
              </TouchableOpacity>
            </View>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    flex: 1,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginHorizontal: 20,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  trackDuration: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  trackActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
});
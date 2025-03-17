import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Plus, FolderPlus, MoveVertical as MoreVertical, Trash2 } from 'lucide-react-native';
import { usePlaylistManager } from '@/hooks/usePlaylistManager';
import { CreatePlaylistModal } from '@/components/CreatePlaylistModal';
import { useState } from 'react';
import { router } from 'expo-router';

export default function PlaylistsScreen() {
  const { playlists, loading, createPlaylist, deletePlaylist } = usePlaylistManager();
  const [modalVisible, setModalVisible] = useState(false);

  const handleCreatePlaylist = async (name: string) => {
    await createPlaylist(name);
  };

  const handlePlaylistPress = (playlistId: string) => {
    router.push({
      pathname: '/playlist/[id]',
      params: { id: playlistId }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Playlists</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Plus color="#FFFFFF" size={24} />
        </TouchableOpacity>
      </View>

      {playlists.length === 0 ? (
        <View style={styles.emptyState}>
          <FolderPlus color="#6366F1" size={64} />
          <Text style={styles.emptyTitle}>No Playlists Yet</Text>
          <Text style={styles.emptyText}>
            Create your first playlist to organize your music
          </Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.createButtonText}>Create Playlist</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.playlistItem}
              onPress={() => handlePlaylistPress(item.id)}
            >
              <View style={styles.playlistInfo}>
                <Text style={styles.playlistName}>{item.name}</Text>
                <Text style={styles.songCount}>
                  {item.tracks.length} songs
                </Text>
              </View>
              <TouchableOpacity
                style={styles.moreButton}
                onPress={() => deletePlaylist(item.id)}
              >
                <Trash2 color="#9CA3AF" size={20} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}

      <CreatePlaylistModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreate={handleCreatePlaylist}
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  addButton: {
    width: 44,
    height: 44,
    backgroundColor: '#6366F1',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginHorizontal: 20,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  songCount: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  moreButton: {
    padding: 8,
  },
});
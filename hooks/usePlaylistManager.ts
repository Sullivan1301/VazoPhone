import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';

export type Playlist = {
  id: string;
  name: string;
  tracks: MediaLibrary.Asset[];
  createdAt: number;
};

export function usePlaylistManager() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      const storedPlaylists = await AsyncStorage.getItem('playlists');
      if (storedPlaylists) {
        setPlaylists(JSON.parse(storedPlaylists));
      }
    } catch (error) {
      console.error('Error loading playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePlaylists = async (updatedPlaylists: Playlist[]) => {
    try {
      await AsyncStorage.setItem('playlists', JSON.stringify(updatedPlaylists));
      setPlaylists(updatedPlaylists);
    } catch (error) {
      console.error('Error saving playlists:', error);
    }
  };

  const createPlaylist = async (name: string) => {
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name,
      tracks: [],
      createdAt: Date.now(),
    };
    const updatedPlaylists = [...playlists, newPlaylist];
    await savePlaylists(updatedPlaylists);
    return newPlaylist;
  };

  const deletePlaylist = async (playlistId: string) => {
    const updatedPlaylists = playlists.filter(p => p.id !== playlistId);
    await savePlaylists(updatedPlaylists);
  };

  const addTrackToPlaylist = async (playlistId: string, track: MediaLibrary.Asset) => {
    const updatedPlaylists = playlists.map(playlist => {
      if (playlist.id === playlistId) {
        const trackExists = playlist.tracks.some(t => t.id === track.id);
        if (!trackExists) {
          return {
            ...playlist,
            tracks: [...playlist.tracks, track],
          };
        }
      }
      return playlist;
    });
    await savePlaylists(updatedPlaylists);
  };

  const removeTrackFromPlaylist = async (playlistId: string, trackId: string) => {
    const updatedPlaylists = playlists.map(playlist => {
      if (playlist.id === playlistId) {
        return {
          ...playlist,
          tracks: playlist.tracks.filter(track => track.id !== trackId),
        };
      }
      return playlist;
    });
    await savePlaylists(updatedPlaylists);
  };

  return {
    playlists,
    loading,
    createPlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
  };
}
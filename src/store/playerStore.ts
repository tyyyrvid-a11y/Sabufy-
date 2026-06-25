import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface Track {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number;
}

export interface Artist {
  id: string;
  name: string;
  thumbnail: string;
}

export interface Playlist {
  id: string;
  title: string;
  author: string;
  thumbnail: string;
  trackCount: number;
}

export interface UserPlaylist {
  id: string;
  title: string;
  createdAt: number;
  tracks: Track[];
}

export interface HistoryItem {
  id: string;
  type: 'song' | 'playlist' | 'artist' | 'album';
  data: any; // Track | Playlist | Artist
  timestamp: number;
}

export type ViewState = 
  | { type: 'explore' }
  | { type: 'search' }
  | { type: 'library' }
  | { type: 'playlist'; id: string }
  | { type: 'artist'; id: string }
  | { type: 'userPlaylist'; id: string };

interface PlayerState {
  // Auth
  user: User | null;
  setUser: (user: User | null) => void;
  syncFromSupabase: () => Promise<void>;
  
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  volume: number;
  searchHistory: string[];
  
  // Library Collections
  savedTracks: Track[];
  savedPlaylists: Playlist[];
  savedArtists: Artist[];
  userPlaylists: UserPlaylist[];
  playHistory: HistoryItem[];
  
  // Modals
  playlistModalTrack: Track | null;
  
  // Settings
  isAutoPlayEnabled: boolean;
  
  // Navigation
  currentView: ViewState;
  
  // Actions
  setCurrentView: (view: ViewState) => void;
  setCurrentTrack: (track: Track) => void;
  setQueue: (tracks: Track[]) => void;
  playNext: () => void;
  playPrevious: () => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  addToQueue: (track: Track) => void;
  addToSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;
  addHistoryItem: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  toggleAutoPlay: () => void;
  
  // Library Actions
  addToLibrary: (track: Track) => void;
  removeFromLibrary: (trackId: string) => void;
  savePlaylist: (playlist: Playlist) => void;
  removePlaylist: (playlistId: string) => void;
  saveArtist: (artist: Artist) => void;
  removeArtist: (artistId: string) => void;
  
  // User Playlists Actions
  createUserPlaylist: (title: string) => void;
  deleteUserPlaylist: (id: string) => void;
  addTrackToUserPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromUserPlaylist: (playlistId: string, trackId: string) => void;
  openPlaylistModal: (track: Track) => void;
  closePlaylistModal: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      syncFromSupabase: async () => {
        const { user } = get();
        if (!user) return;
        
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (data && !error) {
            set({
              savedTracks: data.saved_tracks || [],
              savedPlaylists: data.saved_playlists || [],
              savedArtists: data.saved_artists || [],
              userPlaylists: data.user_playlists || [],
              playHistory: data.play_history || [],
            });
          }
        } catch (err) {
          console.error('Failed to sync from Supabase', err);
        }
      },

      currentTrack: null,
      queue: [],
      isPlaying: false,
      volume: 1,
      searchHistory: [],
      savedTracks: [],
      savedPlaylists: [],
      savedArtists: [],
      userPlaylists: [],
      playHistory: [],
      playlistModalTrack: null,
      isAutoPlayEnabled: true,
      currentView: { type: 'explore' },

      setCurrentView: (view) => set({ currentView: view }),
      
      setCurrentTrack: (track) => set({ currentTrack: track, isPlaying: true }),
      
      addHistoryItem: (item) => {
        const newItem: HistoryItem = {
          ...item,
          id: Math.random().toString(36).substring(2, 9),
          timestamp: Date.now()
        };
        
        set((state) => {
          // Remove duplicates of same item
          const filtered = state.playHistory.filter(h => h.data.id !== item.data.id);
          return { playHistory: [newItem, ...filtered].slice(0, 50) };
        });
      },
      
      setQueue: (tracks) => set({ queue: tracks }),

      playNext: () => {
        const { currentTrack, queue } = get();
        if (!currentTrack || queue.length === 0) return;
        const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
        if (currentIndex !== -1 && currentIndex < queue.length - 1) {
          set({ currentTrack: queue[currentIndex + 1], isPlaying: true });
        }
      },
      
      playPrevious: () => {
        const { currentTrack, queue } = get();
        if (!currentTrack || queue.length === 0) return;
        const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
        if (currentIndex > 0) {
          set({ currentTrack: queue[currentIndex - 1], isPlaying: true });
        }
      },

      setIsPlaying: (isPlaying) => set({ isPlaying }),
      
      setVolume: (volume) => set({ volume }),
      
      addToQueue: (track) => set((state) => ({ 
        queue: [...state.queue.filter(t => t.id !== track.id), track] 
      })),

      addToSearchHistory: (query) => set((state) => ({
        searchHistory: [query, ...state.searchHistory.filter(q => q !== query)].slice(0, 10)
      })),

      clearSearchHistory: () => set({ searchHistory: [] }),

      toggleAutoPlay: () => set((state) => ({ isAutoPlayEnabled: !state.isAutoPlayEnabled })),

      addToLibrary: (track) => set((state) => ({
        savedTracks: state.savedTracks.some(t => t.id === track.id) 
          ? state.savedTracks 
          : [track, ...state.savedTracks]
      })),

      removeFromLibrary: (trackId) => set((state) => ({
        savedTracks: state.savedTracks.filter(t => t.id !== trackId)
      })),

      savePlaylist: (playlist) => set((state) => ({
        savedPlaylists: state.savedPlaylists.some(p => p.id === playlist.id)
          ? state.savedPlaylists
          : [playlist, ...state.savedPlaylists]
      })),

      removePlaylist: (playlistId) => set((state) => ({
        savedPlaylists: state.savedPlaylists.filter(p => p.id !== playlistId)
      })),

      saveArtist: (artist) => set((state) => ({
        savedArtists: state.savedArtists.some(a => a.id === artist.id)
          ? state.savedArtists
          : [artist, ...state.savedArtists]
      })),

      removeArtist: (artistId) => set((state) => ({
        savedArtists: state.savedArtists.filter(a => a.id !== artistId)
      })),

      createUserPlaylist: (title) => set((state) => ({
        userPlaylists: [
          {
            id: `up-${Date.now()}`,
            title,
            createdAt: Date.now(),
            tracks: []
          },
          ...state.userPlaylists
        ]
      })),

      deleteUserPlaylist: (id) => set((state) => ({
        userPlaylists: state.userPlaylists.filter(p => p.id !== id)
      })),

      addTrackToUserPlaylist: (playlistId, track) => set((state) => ({
        userPlaylists: state.userPlaylists.map(p => {
          if (p.id === playlistId) {
            // Avoid duplicates
            if (p.tracks.some(t => t.id === track.id)) return p;
            return { ...p, tracks: [...p.tracks, track] };
          }
          return p;
        })
      })),

      removeTrackFromUserPlaylist: (playlistId, trackId) => set((state) => ({
        userPlaylists: state.userPlaylists.map(p => {
          if (p.id === playlistId) {
            return { ...p, tracks: p.tracks.filter(t => t.id !== trackId) };
          }
          return p;
        })
      })),

      openPlaylistModal: (track) => set({ playlistModalTrack: track }),
      closePlaylistModal: () => set({ playlistModalTrack: null }),
    }),
    {
      name: 'spotify-music-storage',
      partialize: (state) => ({ 
        searchHistory: state.searchHistory,
        savedTracks: state.savedTracks,
        savedPlaylists: state.savedPlaylists,
        savedArtists: state.savedArtists,
        userPlaylists: state.userPlaylists,
        playHistory: state.playHistory,
        isAutoPlayEnabled: state.isAutoPlayEnabled,
        volume: state.volume
      }),
    }
  )
);

// Subscribe to state changes to sync with Supabase
let syncTimeout: NodeJS.Timeout;

usePlayerStore.subscribe((state, prevState) => {
  if (!state.user) return;

  // Only sync if library or history changed
  const hasChanged = 
    state.savedTracks !== prevState.savedTracks ||
    state.savedPlaylists !== prevState.savedPlaylists ||
    state.savedArtists !== prevState.savedArtists ||
    state.userPlaylists !== prevState.userPlaylists ||
    state.playHistory !== prevState.playHistory;

  if (hasChanged) {
    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(async () => {
      try {
        await supabase
          .from('profiles')
          .update({
            saved_tracks: state.savedTracks,
            saved_playlists: state.savedPlaylists,
            saved_artists: state.savedArtists,
            user_playlists: state.userPlaylists,
            play_history: state.playHistory,
            updated_at: new Date().toISOString()
          })
          .eq('id', state.user!.id);
      } catch (err) {
        console.error('Failed to sync to Supabase', err);
      }
    }, 1000); // Debounce 1s
  }
});

import React, { useState } from 'react';
import { usePlayerStore, Track, Playlist, Artist, UserPlaylist } from '../store/playerStore';
import { Play, Trash2, Search, Plus, ListMusic } from 'lucide-react';
import { formatDuration } from '../lib/utils';

export default function Library() {
  const { savedTracks, savedPlaylists, savedArtists, userPlaylists, createUserPlaylist, setCurrentTrack, addToQueue, removeFromLibrary, removePlaylist, removeArtist, deleteUserPlaylist, setCurrentView } = usePlayerStore();
  const [activeFilter, setActiveFilter] = useState<'All' | 'Playlists' | 'Albums' | 'Artists' | 'Songs'>('All');

  const handlePlay = (track: Track) => {
    setCurrentTrack(track);
    addToQueue(track);
  };

  const openView = (type: 'artist' | 'playlist' | 'userPlaylist', id: string) => {
    setCurrentView({ type, id });
  };

  const filters = ['All', 'Playlists', 'Albums', 'Artists', 'Songs'];

  const renderContent = () => {
    const items: { type: string, data: any }[] = [];
    
    if (activeFilter === 'All' || activeFilter === 'Playlists') {
      userPlaylists.forEach(p => items.push({ type: 'userPlaylist', data: p }));
    }
    if (activeFilter === 'All' || activeFilter === 'Albums') {
      savedPlaylists.forEach(p => items.push({ type: 'playlist', data: p }));
    }
    if (activeFilter === 'All' || activeFilter === 'Artists') {
      savedArtists.forEach(a => items.push({ type: 'artist', data: a }));
    }
    if (activeFilter === 'All' || activeFilter === 'Songs') {
      savedTracks.forEach(t => items.push({ type: 'song', data: t }));
    }

    if (items.length === 0) {
      return (
        <div className="text-center mt-20">
          <h2 className="text-2xl font-bold text-m3-on-surface mb-2">It's a bit empty here...</h2>
          <p className="text-neutral-400">Save some songs, artists, or albums to your library.</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {items.map((item, index) => {
          if (item.type === 'song') {
            const track = item.data as Track;
            return (
              <div key={`song-${track.id}-${index}`} className="flex items-center p-3 hover:bg-white/5 rounded-xl group transition-colors cursor-pointer" onClick={() => handlePlay(track)}>
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-m3-surface-container flex-shrink-0">
                  <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                  </div>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <h4 className="font-semibold text-[15px] truncate text-m3-on-surface">{track.title}</h4>
                  <p className="text-[13px] text-neutral-400 hover:text-white hover:underline truncate mt-0.5">{track.artist}</p>
                </div>
                <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center space-x-4">
                  <button onClick={(e) => { e.stopPropagation(); removeFromLibrary(track.id); }} className="p-2 text-neutral-400 hover:text-m3-primary transition-colors hover:scale-105">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <span className="text-[13px] text-neutral-400 w-12 text-right">{formatDuration(track.duration)}</span>
                </div>
              </div>
            );
          } else if (item.type === 'playlist') {
            const playlist = item.data as Playlist;
            return (
              <div key={`playlist-${playlist.id}-${index}`} className="flex items-center p-3 hover:bg-white/5 rounded-xl group transition-colors cursor-pointer" onClick={() => openView('playlist', playlist.id)}>
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-m3-surface-container flex-shrink-0">
                  <img src={playlist.thumbnail} alt={playlist.title} className="w-full h-full object-cover" />
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <h4 className="font-semibold text-[15px] truncate text-m3-on-surface">{playlist.title}</h4>
                  <p className="text-[13px] text-neutral-400 truncate mt-0.5">
                    Album • {playlist.author}
                  </p>
                </div>
                <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center space-x-4">
                  <button onClick={(e) => { e.stopPropagation(); removePlaylist(playlist.id); }} className="p-2 text-neutral-400 hover:text-m3-primary transition-colors hover:scale-105">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );

          } else if (item.type === 'userPlaylist') {
            const playlist = item.data as UserPlaylist;
            return (
              <div key={`userplaylist-${playlist.id}-${index}`} className="flex items-center p-3 hover:bg-white/5 rounded-xl group transition-colors cursor-pointer" onClick={() => openView('userPlaylist', playlist.id)}>
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white/5 flex items-center justify-center flex-shrink-0">
                  {playlist.tracks.length > 0 ? (
                    <img src={playlist.tracks[0].thumbnail} alt={playlist.title} className="w-full h-full object-cover opacity-80" />
                  ) : (
                    <ListMusic className="w-5 h-5 text-neutral-400" />
                  )}
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <h4 className="font-semibold text-[15px] truncate text-m3-on-surface">{playlist.title}</h4>
                  <p className="text-[13px] text-neutral-400 truncate mt-0.5">
                    Playlist • {playlist.tracks.length} tracks
                  </p>
                </div>
                <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center space-x-4">
                  <button onClick={(e) => { e.stopPropagation(); deleteUserPlaylist(playlist.id); }} className="p-2 text-neutral-400 hover:text-m3-primary transition-colors hover:scale-105">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          } else {
            const artist = item.data as Artist;
            return (
              <div key={`artist-${artist.id}-${index}`} className="flex items-center p-3 hover:bg-white/5 rounded-xl group transition-colors cursor-pointer" onClick={() => openView('artist', artist.id)}>
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-m3-surface-container flex-shrink-0">
                  <img src={artist.thumbnail} alt={artist.name} className="w-full h-full object-cover" />
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <h4 className="font-semibold text-[15px] truncate text-m3-on-surface">{artist.name}</h4>
                  <p className="text-[13px] text-neutral-400 truncate mt-0.5">Artist</p>
                </div>
                <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center space-x-4">
                  <button onClick={(e) => { e.stopPropagation(); removeArtist(artist.id); }} className="p-2 text-neutral-400 hover:text-m3-primary transition-colors hover:scale-105">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          }
        })}
      </div>
    );
  };

  return (
    <div className="pb-32 md:pb-28 px-4 md:px-0">
      <div className="flex items-center justify-between mb-8 sticky top-0 md:-top-10 z-20 bg-m3-surface/80 backdrop-blur-xl py-4 border-b border-white/5">
        <h1 className="text-4xl font-bold tracking-tighter text-m3-on-surface">Library</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              const name = prompt('Enter playlist name:');
              if (name && name.trim()) createUserPlaylist(name.trim());
            }}
            className="p-2 text-m3-on-surface hover:bg-m3-surface-container-high transition-colors bg-m3-surface-container rounded-full"
            title="Create Playlist"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button className="p-2 text-m3-on-surface hover:bg-m3-surface-container-high transition-colors bg-m3-surface-container rounded-full">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 hide-scrollbar">
        {filters.map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter as any)}
            className={`px-4 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors ${
              activeFilter === filter 
                ? 'bg-m3-secondary-container text-m3-on-secondary-container' 
                : 'bg-m3-surface-container text-m3-on-surface hover:bg-m3-surface-container-high'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {renderContent()}
    </div>
  );
}

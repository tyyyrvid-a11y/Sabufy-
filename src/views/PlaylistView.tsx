import React, { useEffect, useState } from 'react';
import { usePlayerStore, Track, Playlist } from '../store/playerStore';
import { getAlbumDetailsItunes, getPlaylistDetails } from '../lib/api';
import { Play, Loader2, Plus, Check } from 'lucide-react';
import { formatDuration } from '../lib/utils';

export default function PlaylistView({ id }: { id: string }) {
  const [playlist, setPlaylist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { setCurrentTrack, setQueue, savedPlaylists, savePlaylist, removePlaylist, openPlaylistModal, addHistoryItem } = usePlayerStore();

  useEffect(() => {
    setLoading(true);
    const isItunesId = /^\d+$/.test(id);
    const fetchDetails = isItunesId ? getAlbumDetailsItunes(id) : getPlaylistDetails(id);
    
    fetchDetails
      .then(data => {
        setPlaylist(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const isSaved = savedPlaylists.some(p => p.id === id);

  const handlePlayAll = () => {
    if (!playlist || playlist.tracks.length === 0) return;
    setQueue(playlist.tracks);
    setCurrentTrack(playlist.tracks[0]);
    addHistoryItem({
      type: 'album',
      data: {
        id: playlist.id,
        title: playlist.title,
        author: playlist.author,
        thumbnail: playlist.thumbnail,
        trackCount: playlist.trackCount
      }
    });
  };

  const toggleSave = () => {
    if (!playlist) return;
    if (isSaved) {
      removePlaylist(id);
    } else {
      savePlaylist({
        id: playlist.id,
        title: playlist.title,
        author: playlist.author,
        thumbnail: playlist.thumbnail,
        trackCount: playlist.trackCount,
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center my-32"><Loader2 className="w-10 h-10 animate-spin text-apple-red" /></div>;
  }

  if (!playlist) {
    return <div className="text-white text-center mt-20">Album not found</div>;
  }

  return (
    <div className="pb-32 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8 pt-8">
        <img src={playlist.thumbnail} alt={playlist.title} className="w-48 h-48 md:w-56 md:h-56 shadow-2xl rounded-2xl" />
        <div>
          <span className="text-[13px] font-semibold text-apple-red mb-2 block uppercase tracking-wide">Album</span>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter leading-tight">{playlist.title}</h1>
          <p className="text-sm font-medium text-white/80">
            {playlist.author} • {playlist.trackCount} songs
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 mb-8">
        <button 
          onClick={handlePlayAll}
          disabled={playlist.tracks.length === 0}
          className="w-14 h-14 bg-apple-red text-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-xl disabled:opacity-50 disabled:hover:scale-100"
        >
          <Play className="w-6 h-6 ml-1 fill-current" />
        </button>
        <button onClick={toggleSave} className="text-white/60 hover:text-apple-red transition-colors" title={isSaved ? "Remove from Library" : "Save to Library"}>
          {isSaved ? <Check className="w-8 h-8 text-apple-red" /> : <Plus className="w-8 h-8" />}
        </button>
      </div>

      <div className="space-y-1">
        {playlist.tracks.map((track: Track, index: number) => (
          <div 
            key={track.id} 
            className="flex items-center p-3 hover:bg-white/5 rounded-xl group transition-colors cursor-pointer"
            onClick={() => {
              setQueue(playlist.tracks);
              setCurrentTrack(track);
              addHistoryItem({
                type: 'album',
                data: {
                  id: playlist.id,
                  title: playlist.title,
                  author: playlist.author,
                  thumbnail: playlist.thumbnail,
                  trackCount: playlist.trackCount
                }
              });
            }}
          >
            <div className="w-8 text-center text-neutral-400 group-hover:hidden">{index + 1}</div>
            <div className="w-8 text-center text-white hidden group-hover:block"><Play className="w-4 h-4 fill-current mx-auto" /></div>
            
            <div className="ml-4 flex-1 min-w-0">
              <h4 className="font-semibold text-[15px] truncate text-white">{track.title}</h4>
              <p className="text-[13px] text-neutral-400 hover:text-white hover:underline truncate mt-0.5">{track.artist}</p>
            </div>
            <div className="ml-4 flex items-center space-x-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <button onClick={(e) => { e.stopPropagation(); openPlaylistModal(track); }} className="text-neutral-400 hover:text-apple-red transition-colors hover:scale-105" title="Add to Library or Playlist">
                <Plus className="w-5 h-5" />
              </button>
              <span className="text-[13px] text-neutral-400 w-12 text-right">{formatDuration(track.duration)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

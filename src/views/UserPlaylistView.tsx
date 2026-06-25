import React from 'react';
import { usePlayerStore, Track } from '../store/playerStore';
import { Play, Trash2, ListMusic } from 'lucide-react';
import { formatDuration } from '../lib/utils';

export default function UserPlaylistView({ id }: { id: string }) {
  const { 
    userPlaylists, 
    setCurrentTrack, 
    setQueue, 
    removeTrackFromUserPlaylist, 
    deleteUserPlaylist,
    setCurrentView
  } = usePlayerStore();

  const playlist = userPlaylists.find(p => p.id === id);

  if (!playlist) {
    return <div className="text-white text-center mt-20">Playlist not found</div>;
  }

  const handlePlayAll = () => {
    if (playlist.tracks.length === 0) return;
    setQueue(playlist.tracks);
    setCurrentTrack(playlist.tracks[0]);
  };

  const handleDeletePlaylist = () => {
    deleteUserPlaylist(id);
    setCurrentView({ type: 'library' });
  };

  return (
    <div className="pb-32 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8 pt-8">
        <div className="w-48 h-48 md:w-56 md:h-56 shadow-2xl rounded-2xl bg-apple-gray flex items-center justify-center overflow-hidden">
          {playlist.tracks.length > 0 ? (
            <div className="w-full h-full grid grid-cols-2 grid-rows-2">
              {/* Show up to 4 covers */}
              {playlist.tracks.slice(0, 4).map((t, i) => (
                <img key={i} src={t.thumbnail} alt="" className="w-full h-full object-cover" />
              ))}
              {/* Fill remaining slots with the first cover if < 4 tracks */}
              {playlist.tracks.length < 4 && Array.from({ length: 4 - playlist.tracks.length }).map((_, i) => (
                <img key={`filler-${i}`} src={playlist.tracks[0].thumbnail} alt="" className="w-full h-full object-cover" />
              ))}
            </div>
          ) : (
            <ListMusic className="w-20 h-20 text-neutral-500" />
          )}
        </div>
        <div>
          <span className="text-[13px] font-semibold text-apple-red mb-2 block uppercase tracking-wide">Playlist</span>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter leading-tight">{playlist.title}</h1>
          <p className="text-sm font-medium text-white/80">
            {playlist.tracks.length} songs
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
        
        <button 
          onClick={handleDeletePlaylist}
          className="px-4 py-2 border border-white/20 hover:border-apple-red hover:text-apple-red rounded-full text-[13px] font-bold text-white transition-colors"
        >
          Delete Playlist
        </button>
      </div>

      <div className="space-y-1">
        {playlist.tracks.length === 0 ? (
          <div className="text-center py-20 text-neutral-400">
            This playlist is empty. Go find some songs!
          </div>
        ) : (
          playlist.tracks.map((track: Track, index: number) => (
            <div 
              key={`${track.id}-${index}`} 
              className="flex items-center p-3 hover:bg-white/5 rounded-xl group transition-colors cursor-pointer"
              onClick={() => {
                setQueue(playlist.tracks);
                setCurrentTrack(track);
              }}
            >
              <div className="w-8 text-center text-neutral-400 group-hover:hidden">{index + 1}</div>
              <div className="w-8 text-center text-white hidden group-hover:block"><Play className="w-4 h-4 fill-current mx-auto" /></div>
              
              <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-apple-gray flex-shrink-0 ml-2">
                <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <h4 className="font-semibold text-[15px] truncate text-white">{track.title}</h4>
                <p className="text-[13px] text-neutral-400 hover:text-white hover:underline truncate mt-0.5">{track.artist}</p>
              </div>
              <div className="ml-4 flex items-center space-x-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); removeTrackFromUserPlaylist(playlist.id, track.id); }} 
                  className="p-2 text-neutral-400 hover:text-apple-red transition-colors hover:scale-105"
                  title="Remove from Playlist"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <span className="text-[13px] text-neutral-400 w-12 text-right">{formatDuration(track.duration)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

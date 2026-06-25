import React, { useState } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { X, Plus, Music, ListMusic } from 'lucide-react';

export default function AddToPlaylistModal() {
  const { 
    playlistModalTrack, 
    closePlaylistModal, 
    userPlaylists, 
    createUserPlaylist, 
    addTrackToUserPlaylist,
    addToLibrary,
    savedTracks
  } = usePlayerStore();
  
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  if (!playlistModalTrack) return null;

  const handleClose = () => {
    closePlaylistModal();
    setIsCreating(false);
    setNewPlaylistName('');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      createUserPlaylist(newPlaylistName.trim());
      setIsCreating(false);
      setNewPlaylistName('');
    }
  };

  const handleAddToPlaylist = (playlistId: string) => {
    addTrackToUserPlaylist(playlistId, playlistModalTrack);
    handleClose();
  };

  const handleAddToLibrary = () => {
    addToLibrary(playlistModalTrack);
    handleClose();
  };

  const isSavedToLibrary = savedTracks.some(t => t.id === playlistModalTrack.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={handleClose}>
      <div 
        className="bg-apple-gray w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white tracking-tight">Add to Playlist</h2>
          <button onClick={handleClose} className="p-2 text-neutral-400 hover:text-white rounded-full hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex items-center gap-4 bg-white/5">
          <img src={playlistModalTrack.thumbnail} alt={playlistModalTrack.title} className="w-12 h-12 rounded object-cover shadow-md" />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white truncate text-[15px]">{playlistModalTrack.title}</h4>
            <p className="text-[13px] text-neutral-400 truncate">{playlistModalTrack.artist}</p>
          </div>
        </div>

        <div className="overflow-y-auto p-4 custom-scrollbar flex-1">
          {/* Library Option */}
          <button 
            onClick={handleAddToLibrary}
            disabled={isSavedToLibrary}
            className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors text-left disabled:opacity-50 disabled:hover:bg-transparent"
          >
            <div className="w-12 h-12 rounded-lg bg-apple-red/20 flex items-center justify-center flex-shrink-0">
              <Music className="w-6 h-6 text-apple-red" />
            </div>
            <span className="font-semibold text-white text-[15px]">
              {isSavedToLibrary ? 'Already in Library' : 'Save to Library'}
            </span>
          </button>

          <div className="my-4 h-px bg-white/10" />

          {/* Create New Option */}
          {isCreating ? (
            <form onSubmit={handleCreate} className="mb-4">
              <input
                autoFocus
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Playlist name..."
                className="w-full bg-black/40 text-white placeholder-neutral-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-apple-red/50 border border-white/10"
              />
              <div className="flex justify-end gap-2 mt-3">
                <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-1.5 text-sm font-semibold text-neutral-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={!newPlaylistName.trim()} className="px-4 py-1.5 text-sm font-bold bg-apple-red text-white rounded-full disabled:opacity-50">Create</button>
              </div>
            </form>
          ) : (
            <button 
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group mb-2"
            >
              <div className="w-12 h-12 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors flex items-center justify-center flex-shrink-0">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <span className="font-semibold text-white text-[15px]">New Playlist</span>
            </button>
          )}

          {/* User Playlists */}
          <div className="space-y-1">
            {userPlaylists.map(playlist => {
              const isAdded = playlist.tracks.some(t => t.id === playlistModalTrack.id);
              return (
                <button
                  key={playlist.id}
                  onClick={() => handleAddToPlaylist(playlist.id)}
                  disabled={isAdded}
                  className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors text-left disabled:opacity-50 disabled:hover:bg-transparent group"
                >
                  <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                    {playlist.tracks.length > 0 ? (
                      <img src={playlist.tracks[0].thumbnail} alt={playlist.title} className="w-full h-full object-cover opacity-80" />
                    ) : (
                      <ListMusic className="w-5 h-5 text-neutral-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white truncate text-[15px]">{playlist.title}</h4>
                    <p className="text-[13px] text-neutral-400">
                      {isAdded ? 'Already added' : `${playlist.tracks.length} tracks`}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { usePlayerStore, Track } from '../store/playerStore';
import { getArtistDetailsItunes, getArtistDetails } from '../lib/api';
import { Play, Loader2, Plus, Check } from 'lucide-react';
import { formatDuration } from '../lib/utils';

export default function ArtistView({ id }: { id: string }) {
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { setCurrentTrack, setQueue, savedArtists, saveArtist, removeArtist, openPlaylistModal } = usePlayerStore();

  useEffect(() => {
    setLoading(true);
    const isItunesId = /^\d+$/.test(id);
    const fetchDetails = isItunesId ? getArtistDetailsItunes(id) : getArtistDetails(id);
    
    fetchDetails
      .then(data => {
        setArtist(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const isSaved = savedArtists.some(a => a.id === id);

  const handlePlayAll = () => {
    if (!artist || artist.tracks.length === 0) return;
    setQueue(artist.tracks);
    setCurrentTrack(artist.tracks[0]);
  };

  const toggleSave = () => {
    if (!artist) return;
    if (isSaved) {
      removeArtist(id);
    } else {
      saveArtist({
        id: artist.id,
        name: artist.name,
        thumbnail: artist.thumbnail,
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center my-32"><Loader2 className="w-10 h-10 animate-spin text-apple-red" /></div>;
  }

  if (!artist) {
    return <div className="text-white text-center mt-20">Artist not found</div>;
  }

  return (
    <div className="pb-32">
      <div className="relative h-64 md:h-80 -mx-6 md:-mx-8 px-6 md:px-8 flex flex-col justify-end pb-8 mb-8">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${artist.banner || artist.thumbnail})` }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-apple-base via-apple-base/80 to-transparent"></div>
        <div className="relative z-10 flex items-end gap-6">
          <img src={artist.thumbnail} alt={artist.name} className="w-32 h-32 md:w-48 md:h-48 rounded-full shadow-2xl object-cover" />
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-2">{artist.name}</h1>
        </div>
      </div>

      <div className="px-4 md:px-0">
        <div className="flex items-center gap-6 mb-8">
          <button 
            onClick={handlePlayAll}
            className="w-14 h-14 bg-apple-red text-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-xl"
          >
            <Play className="w-6 h-6 ml-1 fill-current" />
          </button>
          <button 
            onClick={toggleSave} 
            className="px-4 py-1.5 border border-white/40 rounded-full text-white text-sm font-bold hover:border-white transition-colors uppercase tracking-widest"
          >
            {isSaved ? "Following" : "Follow"}
          </button>
        </div>

        <h2 className="text-2xl font-bold text-white mb-4">Popular</h2>
        <div className="space-y-1">
          {artist.tracks.map((track: Track, index: number) => (
            <div 
              key={track.id} 
              className="flex items-center p-3 hover:bg-white/5 rounded-xl group transition-colors cursor-pointer"
              onClick={() => {
                setQueue(artist.tracks);
                setCurrentTrack(track);
              }}
            >
              <div className="w-8 text-center text-neutral-400 group-hover:hidden">{index + 1}</div>
              <div className="w-8 text-center text-white hidden group-hover:block"><Play className="w-4 h-4 fill-current mx-auto" /></div>
              
              <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-apple-gray flex-shrink-0 ml-2">
                <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <h4 className="font-semibold text-base truncate text-white">{track.title}</h4>
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
    </div>
  );
}

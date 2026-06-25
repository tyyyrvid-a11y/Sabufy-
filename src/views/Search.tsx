import React, { useState, useEffect } from 'react';
import { usePlayerStore, Track } from '../store/playerStore';
import { searchTracksItunes, searchArtistsItunes, searchAlbumsItunes } from '../lib/api';
import { Search as SearchIcon, Loader2, Play, Plus } from 'lucide-react';
import { formatDuration } from '../lib/utils';

const categories = [
  { name: 'Podcasts', color: 'bg-orange-500' },
  { name: 'Live Events', color: 'bg-purple-500' },
  { name: 'Made For You', color: 'bg-blue-800' },
  { name: 'New Releases', color: 'bg-pink-600' },
  { name: 'Pop', color: 'bg-emerald-500' },
  { name: 'Hip-Hop', color: 'bg-yellow-600' },
  { name: 'Rock', color: 'bg-red-600' },
  { name: 'Latin', color: 'bg-pink-500' },
];

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'songs' | 'artists' | 'albums'>('songs');

  const { setCurrentTrack, addToQueue, searchHistory, addToSearchHistory, clearSearchHistory, addToLibrary, openPlaylistModal, setCurrentView } = usePlayerStore();

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);
    try {
      let data: any[] = [];
      if (filter === 'songs') {
        data = await searchTracksItunes(query);
      } else if (filter === 'artists') {
        data = await searchArtistsItunes(query);
      } else if (filter === 'albums') {
        data = await searchAlbumsItunes(query);
      }
      setResults(data);
      if (e) addToSearchHistory(query.trim());
    } catch (err) {
      setError('Failed to fetch results. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (query.trim()) {
      handleSearch();
    } else {
      setResults([]);
    }
  }, [filter]);

  const handlePlay = (track: Track) => {
    setCurrentTrack(track);
    addToQueue(track);
  };

  const executeSearch = (q: string) => {
    setQuery(q);
    setTimeout(() => {
      handleSearch({ preventDefault: () => {} } as React.FormEvent);
    }, 0);
  };

  const openView = (type: 'artist' | 'album', id: string) => {
    setCurrentView({ type: type === 'album' ? 'playlist' : 'artist', id }); // Keep playlist type for now internally
  };

  return (
    <div className="pb-32 md:pb-28 px-4 md:px-0">
      <form onSubmit={handleSearch} className="relative mb-6 sticky top-4 z-20 max-w-md">
        <div className="relative group">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-white transition-colors" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-m3-surface-container hover:bg-m3-surface-container-high transition-colors text-m3-on-surface placeholder-neutral-400 rounded-full py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-m3-primary/50 border-2 border-transparent focus:border-transparent focus:bg-m3-surface-container-high"
          />
        </div>
      </form>

      {query && (
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 hide-scrollbar">
          <button onClick={() => setFilter('songs')} className={`px-4 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors ${filter === 'songs' ? 'bg-m3-secondary-container text-m3-on-secondary-container' : 'bg-m3-surface-container text-m3-on-surface hover:bg-m3-surface-container-high'}`}>Songs</button>
          <button onClick={() => setFilter('artists')} className={`px-4 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors ${filter === 'artists' ? 'bg-m3-secondary-container text-m3-on-secondary-container' : 'bg-m3-surface-container text-m3-on-surface hover:bg-m3-surface-container-high'}`}>Artists</button>
          <button onClick={() => setFilter('albums')} className={`px-4 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors ${filter === 'albums' ? 'bg-m3-secondary-container text-m3-on-secondary-container' : 'bg-m3-surface-container text-m3-on-surface hover:bg-m3-surface-container-high'}`}>Albums</button>
        </div>
      )}

      {error && (
        <div className="text-red-500 text-center my-8">{error}</div>
      )}

      {isSearching ? (
        <div className="flex justify-center my-20">
          <Loader2 className="w-10 h-10 animate-spin text-m3-primary" />
        </div>
      ) : results.length > 0 ? (
        <div>
           <div className={filter === 'songs' ? "space-y-1" : "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4"}>
             {results.map((item) => {
               if (filter === 'songs') {
                 return (
                    <div key={item.id} className="flex items-center p-3 hover:bg-white/5 rounded-xl group transition-colors cursor-pointer" onClick={() => handlePlay(item)}>
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-m3-surface-container flex-shrink-0">
                        <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-black/40 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                       </div>
                     </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <h4 className="font-semibold text-[15px] truncate text-m3-on-surface">{item.title}</h4>
                        <p className="text-[13px] text-neutral-400 hover:text-white hover:underline truncate mt-0.5">{item.artist}</p>
                     </div>
                      <div className="ml-4 flex items-center space-x-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                         <button onClick={(e) => { e.stopPropagation(); openPlaylistModal(item); }} className="text-neutral-400 hover:text-m3-primary transition-colors hover:scale-105" title="Add to Library or Playlist">
                          <Plus className="w-5 h-5" />
                       </button>
                       <span className="text-[13px] text-neutral-400 w-12 text-right">{formatDuration(item.duration)}</span>
                     </div>
                   </div>
                 );
               } else if (filter === 'artists') {
                  return (
                    <div key={item.id} className="bg-m3-surface-container p-4 rounded-2xl hover:bg-m3-surface-container-high transition-colors cursor-pointer group shadow-sm" onClick={() => openView('artist', item.id)}>
                      <div className="relative aspect-square rounded-full overflow-hidden mb-4 shadow-xl">
                        <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <h4 className="font-semibold text-[15px] text-m3-on-surface truncate">{item.name}</h4>
                      <p className="text-[13px] text-neutral-400 mt-1">Artist</p>
                   </div>
                 );
               } else {
                  return (
                    <div key={item.id} className="bg-m3-surface-container p-4 rounded-2xl hover:bg-m3-surface-container-high transition-colors cursor-pointer group shadow-sm" onClick={() => openView('album', item.id)}>
                      <div className="relative aspect-square rounded-xl overflow-hidden mb-4 shadow-md">
                        <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      <h4 className="font-semibold text-[15px] text-m3-on-surface truncate">{item.title}</h4>
                      <p className="text-[13px] text-neutral-400 truncate mt-1">
                       Album • {item.author}
                     </p>
                   </div>
                 );
               }
             })}
           </div>
        </div>
      ) : query === '' ? (
        <div>
          {searchHistory.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                 <h2 className="text-xl font-bold text-m3-on-surface tracking-tight">Recent searches</h2>
                 <button onClick={clearSearchHistory} className="text-[13px] text-neutral-400 hover:text-m3-primary hover:underline font-semibold">Clear</button>
              </div>
              <div className="flex flex-wrap gap-3">
                {searchHistory.map((h, i) => (
                  <button key={i} onClick={() => executeSearch(h)} className="px-4 py-2 bg-m3-surface-container rounded-full text-[13px] font-semibold hover:bg-m3-surface-container-high transition-colors text-m3-on-surface flex items-center gap-2">
                    <SearchIcon className="w-4 h-4 text-neutral-400" />
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
             <h2 className="text-xl font-bold text-m3-on-surface tracking-tight mb-4">Browse all</h2>
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {categories.map((cat, i) => (
                  <div key={i} onClick={() => executeSearch(cat.name)} className={`relative aspect-square ${cat.color} rounded-xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform`}>
                     <h3 className="text-xl font-bold text-white p-4">{cat.name}</h3>
                     <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-black/20 transform rotate-[25deg] shadow-lg rounded-md"></div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { usePlayerStore, Track } from '../store/playerStore';
import { Play } from 'lucide-react';

const mockHighlights: Track[] = [
  {
    id: "kJQP7kiw5Fk",
    title: "Despacito",
    artist: "Luis Fonsi",
    thumbnail: "https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
    duration: 282
  },
  {
    id: "JGwWNGJdvx8",
    title: "Shape of You",
    artist: "Ed Sheeran",
    thumbnail: "https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg",
    duration: 264
  },
  {
    id: "fJ9rUzIMcZQ",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    thumbnail: "https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg",
    duration: 359
  },
  {
    id: "09R8_2nJtjg",
    title: "Sugar",
    artist: "Maroon 5",
    thumbnail: "https://i.ytimg.com/vi/09R8_2nJtjg/hqdefault.jpg",
    duration: 302
  },
  {
    id: "RgKAFK5djSk",
    title: "See You Again",
    artist: "Wiz Khalifa",
    thumbnail: "https://i.ytimg.com/vi/RgKAFK5djSk/hqdefault.jpg",
    duration: 238
  },
  {
    id: "OPf0YbXqDm0",
    title: "Uptown Funk",
    artist: "Mark Ronson",
    thumbnail: "https://i.ytimg.com/vi/OPf0YbXqDm0/hqdefault.jpg",
    duration: 271
  }
];

export default function Explore() {
  const { setCurrentTrack, addToQueue, playHistory, setCurrentView } = usePlayerStore();
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    // Recommendation Algorithm
    // If no history, use mockHighlights
    if (playHistory.length === 0) {
      setRecommendations(mockHighlights);
      return;
    }

    const fetchRecs = async () => {
      setLoadingRecs(true);
      try {
        // Get the most recent song or artist
        const latestSong = playHistory.find(h => h.type === 'song');
        const query = latestSong ? `${latestSong.data.artist} music` : 'pop hits';
        
        const response = await fetch(`/api/yt-search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data && data.length > 0) {
          // Map to Track interface
          const mapped = data.map((item: any) => ({
            id: item.videoId,
            title: item.title,
            artist: item.author,
            thumbnail: item.thumbnail,
            duration: item.duration || 180
          }));
          setRecommendations(mapped.slice(0, 10));
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setRecommendations(mockHighlights);
      } finally {
        setLoadingRecs(false);
      }
    };

    fetchRecs();
  }, [playHistory]);

  const handlePlay = (track: Track) => {
    setCurrentTrack(track);
    addToQueue(track);
  };

  return (
    <div className="pb-32 md:pb-28">
      {/* Top Header Buttons */}
      <div className="flex justify-end gap-4 px-6 pt-4 mb-4">
        <button className="w-12 h-12 bg-m3-surface-container rounded-full flex items-center justify-center text-m3-on-surface hover:bg-m3-surface-container-high transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
        </button>
        <button className="w-12 h-12 bg-m3-surface-container rounded-full flex items-center justify-center text-m3-on-surface hover:bg-m3-surface-container-high transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </div>

      {/* Your Mix Hero Section */}
      <section className="px-6 mb-16 mt-2 relative">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-[72px] font-black text-m3-on-surface leading-[0.85] tracking-tighter mb-4">
              Your<br/>Mix
            </h1>
            <p className="text-lg text-neutral-400 font-medium">Today's Mix for you</p>
          </div>
          <button 
            className="w-28 h-28 bg-m3-primary-container text-m3-on-primary-container rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-xl mt-2 mr-2"
            onClick={() => handlePlay(mockHighlights[2])}
          >
            <Play className="w-12 h-12 fill-current ml-2" />
          </button>
        </div>

        {/* Organic Blobs */}
        <div className="relative h-[340px] mt-16 w-full max-w-sm mx-auto flex items-center justify-center">
          {/* Small Top Left Blob */}
          <div 
            className="absolute top-2 left-0 w-24 h-24 rounded-full overflow-hidden shadow-2xl z-20 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => handlePlay(mockHighlights[3])}
          >
            <img src={mockHighlights[3].thumbnail} alt="" className="w-full h-full object-cover" />
          </div>

          {/* Main Center Organic Blob */}
          <div 
            className="absolute z-10 w-80 h-72 overflow-hidden shadow-2xl cursor-pointer hover:scale-105 transition-transform duration-500"
            style={{ borderRadius: '48% 52% 43% 57% / 54% 45% 55% 46%', transform: 'rotate(-8deg)' }}
            onClick={() => handlePlay(mockHighlights[2])}
          >
            <img src={mockHighlights[2].thumbnail} alt="" className="w-full h-full object-cover scale-110" />
            <div className="absolute inset-0 bg-black/10 transition-colors" />
          </div>

          {/* Small Bottom Right Blob */}
          <div 
            className="absolute -bottom-4 right-2 w-[100px] h-[100px] rounded-full overflow-hidden shadow-2xl z-20 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => handlePlay(mockHighlights[1])}
          >
            <img src={mockHighlights[1].thumbnail} alt="" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* Made For You Section */}
      <section className="mb-10">
        <div className="flex items-end justify-between px-4 md:px-0 mb-4">
          <h2 className="text-2xl font-bold text-m3-on-surface hover:underline cursor-pointer tracking-tight">Made for You</h2>
          <span className="text-[13px] font-semibold text-m3-primary hover:underline cursor-pointer uppercase tracking-wide hidden md:block">Show all</span>
        </div>
        <div className="flex overflow-x-auto pb-6 -mx-4 px-4 md:mx-0 md:px-0 space-x-6 hide-scrollbar">
          {loadingRecs ? (
             <div className="text-white/50 text-sm animate-pulse w-full">Gerando recomendações baseadas no seu gosto...</div>
          ) : (
            recommendations.map((track) => (
              <div 
                key={`made-${track.id}`} 
                className="group cursor-pointer flex flex-col min-w-[160px] md:min-w-[180px] w-[160px] md:w-[180px]"
                onClick={() => handlePlay(track)}
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden shadow-md mb-3">
                  <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/20 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transform md:translate-y-2 md:group-hover:translate-y-0 transition-all duration-300 z-10 shadow-xl">
                    <div className="w-10 h-10 bg-m3-primary text-m3-on-primary rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-md">
                      <Play className="w-4 h-4 ml-1 fill-current" />
                    </div>
                  </div>
                </div>
                <h3 className="font-semibold text-[15px] leading-tight truncate text-white mb-0.5">{track.title}</h3>
                <p className="text-[13px] text-neutral-400 truncate">{track.artist}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Recently Played Section */}
      <section>
        <div className="flex items-end justify-between px-4 md:px-0 mb-4">
          <h2 className="text-2xl font-bold text-m3-on-surface hover:underline cursor-pointer tracking-tight">Recently played</h2>
        </div>
        <div className="flex overflow-x-auto pb-6 -mx-4 px-4 md:mx-0 md:px-0 space-x-6 hide-scrollbar">
          {playHistory.map((history) => {
            const item = history.data;
            return (
            <div 
              key={history.id} 
              className="group cursor-pointer flex flex-col min-w-[160px] md:min-w-[180px] w-[160px] md:w-[180px]"
              onClick={() => {
                if (history.type === 'album' || history.type === 'playlist') {
                  setCurrentView({ type: 'playlist', id: item.id });
                } else if (history.type === 'song') {
                  handlePlay(item);
                } else if (history.type === 'artist') {
                  setCurrentView({ type: 'artist', id: item.id });
                }
              }}
            >
              <div className={`relative aspect-square rounded-2xl overflow-hidden shadow-md mb-3 ${history.type === 'artist' ? 'rounded-full' : ''}`}>
                <img src={item.thumbnail} alt={item.title || item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/20 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transform md:translate-y-2 md:group-hover:translate-y-0 transition-all duration-300 z-10 shadow-xl">
                  <div className="w-10 h-10 bg-m3-primary text-m3-on-primary rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-md">
                    <Play className="w-4 h-4 ml-1 fill-current" />
                  </div>
                </div>
              </div>
              <h3 className="font-semibold text-[15px] leading-tight truncate text-white mb-0.5">{item.title || item.name}</h3>
              <p className="text-[13px] text-neutral-400 truncate capitalize">{history.type === 'song' ? item.artist : history.type}</p>
            </div>
            );
          })}
          {playHistory.length === 0 && (
            <div className="text-neutral-400 text-sm mt-4 w-full">Sua música recente aparecerá aqui. Comece a ouvir algo!</div>
          )}
        </div>
      </section>
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { usePlayerStore, Track } from '../store/playerStore';
import { getAudioStreamUrl, getRecommendations } from '../lib/api';
import { Play, Pause, SkipBack, SkipForward, VolumeX, Volume2, ListMusic, Maximize2, Minimize2, Infinity } from 'lucide-react';
import { cn, formatDuration } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import ReactPlayer from 'react-player';

export default function AudioPlayer() {
  const { currentTrack, isPlaying, volume, setIsPlaying, setVolume, playNext, playPrevious, isAutoPlayEnabled, toggleAutoPlay, addHistoryItem, playHistory, queue, addToQueue } = usePlayerStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const ytPlayerRef = useRef<ReactPlayer>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentTrack) {
      setIsLoading(true);
      addHistoryItem({ type: 'song', data: currentTrack });
      getAudioStreamUrl(currentTrack)
        .then(url => {
          setStreamUrl(url);
        })
        .catch(err => {
          console.error("Error getting stream", err);
          setIsLoading(false);
          setIsPlaying(false);
        });
    } else {
      setStreamUrl(null);
    }
  }, [currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current && streamUrl) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, streamUrl]);

  const handleTimeUpdate = () => {
    if (audioRef.current && !isYoutube) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleYtProgress = (state: { playedSeconds: number }) => {
    if (isYoutube) setCurrentTime(state.playedSeconds);
  };

  const handleYtDuration = (duration: number) => {
    if (isYoutube) setDuration(duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (isYoutube && ytPlayerRef.current) {
      ytPlayerRef.current.seekTo(time, 'seconds');
    } else if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleTrackEnd = async () => {
    const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
    const hasNext = currentIndex !== -1 && currentIndex < queue.length - 1;
    
    if (hasNext) {
      playNext();
    } else if (isAutoPlayEnabled) {
      setIsLoading(true);
      const historyTracks = playHistory.filter(h => h.type === 'song').map(h => h.data as Track);
      const recentTracks = [currentTrack!, ...historyTracks.filter(t => t.id !== currentTrack?.id)].slice(0, 20);
      const nextTrack = await getRecommendations(recentTracks);
      
      if (nextTrack) {
        addToQueue(nextTrack);
        setTimeout(() => playNext(), 50);
      } else {
        setIsPlaying(false);
        setIsLoading(false);
      }
    } else {
      setIsPlaying(false);
    }
  };

  const isYoutube = streamUrl?.startsWith('youtube:');

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  if (!currentTrack) return null;

  return (
    <>
      <div style={{ display: 'none' }}>
        {isYoutube ? (
          <ReactPlayer
            ref={ytPlayerRef}
            url={`https://www.youtube.com/watch?v=${streamUrl?.replace('youtube:', '')}`}
            playing={isPlaying}
            volume={volume}
            onProgress={handleYtProgress}
            onDuration={handleYtDuration}
            onEnded={handleTrackEnd}
            onReady={() => setIsLoading(false)}
            onError={(e) => {
               console.error("YT Error", e);
               setIsPlaying(false);
               setIsLoading(false);
            }}
            config={{
              youtube: {
                playerVars: { autoplay: 1 }
              }
            }}
          />
        ) : (
          <audio
            ref={audioRef}
            src={streamUrl || undefined}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleTrackEnd}
            onLoadedData={() => {
              setIsLoading(false);
              if (isPlaying) audioRef.current?.play();
            }}
            autoPlay={isPlaying}
          />
        )}
      </div>
      
      {/* Desktop Fixed Footer Player */}
      <div 
        onClick={() => setExpanded(true)}
        className={cn(
          "hidden md:flex fixed bottom-0 left-0 right-0 h-[100px] bg-m3-surface-container z-40 items-center px-6 transition-all duration-500 cursor-pointer hover:bg-m3-surface-container-high",
          expanded ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"
        )}
      >
        <div className="flex items-center w-1/3">
          <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-14 h-14 rounded-lg object-cover shadow-sm" />
          <div className="ml-4 truncate">
            <h4 className="font-semibold text-[15px] truncate text-white hover:underline">{currentTrack.title}</h4>
            <p className="text-[13px] text-neutral-400 hover:text-white truncate">{currentTrack.artist}</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center w-1/3 flex-1 px-4" onClick={e => e.stopPropagation()}>
          <div className="flex items-center space-x-8 mb-2">
            <button onClick={playPrevious} className="text-white/70 hover:text-white transition-colors active:scale-95">
              <SkipBack className="w-5 h-5 fill-current" />
            </button>
            <button 
              onClick={togglePlay}
              disabled={isLoading}
              className="bg-m3-primary text-m3-on-primary rounded-full hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center w-12 h-12 shadow-md"
            >
              {isPlaying && !isLoading ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-0.5" />}
            </button>
            <button onClick={handleTrackEnd} className="text-white/70 hover:text-white transition-colors active:scale-95">
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
          </div>
          
          <div className="flex items-center w-full max-w-lg space-x-3 text-[11px] text-neutral-400 font-medium tracking-wide">
            <span className="min-w-[40px] text-right">{formatDuration(currentTime)}</span>
            <input 
              type="range" 
              min="0" 
              max={duration || 100} 
              value={currentTime} 
              onChange={handleSeek}
              className="flex-1 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-m3-primary transition-all hover:accent-m3-primary-container"
            />
            <span className="min-w-[40px]">{formatDuration(duration || currentTrack.duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-end w-1/3 space-x-6 pr-2 text-white/70" onClick={e => e.stopPropagation()}>
          <button 
            onClick={toggleAutoPlay} 
            className={cn("transition-colors", isAutoPlayEnabled ? "text-m3-primary" : "text-neutral-400 hover:text-white")}
            title="AutoPlay"
          >
            <Infinity className="w-5 h-5" />
          </button>
          <button className="hover:text-white transition-colors">
            <ListMusic className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3 w-28">
            {volume === 0 ? <VolumeX className="w-5 h-5 cursor-pointer" /> : <Volume2 className="w-5 h-5 cursor-pointer" />}
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={volume} 
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-m3-primary transition-all hover:accent-m3-primary-container"
            />
          </div>
        </div>
      </div>

      {/* Mobile Minimized Player */}
      <div className="md:hidden">
        {/* Minimized Player - Above Bottom Nav */}
        <div 
          onClick={() => setExpanded(true)}
          className={cn(
            "fixed left-2 right-2 bottom-[90px] bg-m3-primary-container text-m3-on-primary-container rounded-full shadow-lg z-40 p-2 pl-2 flex items-center transition-transform cursor-pointer mx-2",
            expanded ? "translate-y-24 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
          )}
        >
          <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-12 h-12 rounded-full object-cover shadow-sm" />
          <div className="ml-3 flex-1 truncate">
            <h4 className="font-bold text-[15px] truncate">{currentTrack.title}</h4>
            <p className="text-[13px] opacity-80 truncate">{currentTrack.artist}</p>
          </div>
          <button 
            onClick={togglePlay}
            disabled={isLoading}
            className="w-12 h-12 bg-m3-on-primary-container/10 rounded-full flex items-center justify-center text-m3-on-primary-container disabled:opacity-50 hover:scale-105 active:scale-95 transition-all mr-1"
          >
            {isPlaying && !isLoading ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); playNext(); }}
            className="w-12 h-12 rounded-full flex items-center justify-center text-m3-on-primary-container opacity-80 hover:opacity-100 transition-opacity mr-1"
          >
            <SkipForward className="w-6 h-6 fill-current" />
          </button>
        </div>
      </div>

      {/* Expanded Player Fullscreen (Mobile & Desktop) */}
      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 flex flex-col md:flex-row overflow-hidden bg-m3-surface-container"
          >
            {/* Dynamic Background */}
            <div 
              className="absolute inset-0 opacity-30 bg-cover bg-center transition-opacity duration-1000" 
              style={{ backgroundImage: `url(${currentTrack.thumbnail})`, filter: 'blur(100px) saturate(3)' }} 
            />
            <div className="absolute inset-0 bg-m3-surface-container/60 backdrop-blur-3xl" />

            {/* Content Container */}
            <div className="relative flex-1 flex flex-col md:flex-row px-6 pb-12 pt-8 z-10 w-full max-w-7xl mx-auto h-full">
              
              {/* Mobile Header / Close Button */}
              <div className="md:hidden flex justify-between items-center mb-8 absolute top-8 left-6 right-6 z-20">
                <button onClick={() => setExpanded(false)} className="w-12 h-12 flex items-center justify-center bg-black/20 rounded-full text-white/80 hover:text-white transition-colors">
                  <Minimize2 className="w-6 h-6" />
                </button>
                <span className="text-sm font-bold tracking-wide text-white">Now Playing</span>
                <div className="flex gap-2">
                  <button className="w-12 h-12 flex items-center justify-center bg-black/20 rounded-full text-white/80 hover:text-white transition-colors">
                    <ListMusic className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Desktop Close Button */}
              <button 
                onClick={() => setExpanded(false)} 
                className="hidden md:flex absolute top-10 right-10 p-4 bg-m3-surface-container-high hover:bg-m3-surface-container-highest rounded-full text-m3-on-surface transition-all z-20 hover:scale-105 active:scale-95"
              >
                <Minimize2 className="w-6 h-6" />
              </button>

              {/* Left Side: Artwork & Lights */}
              <div className="flex-1 flex items-center justify-center min-h-[300px] md:h-full relative mt-10 md:mt-0 pt-8 md:pt-0">
                {/* Reactive Light Effect (Primary Glow) */}
                <motion.div
                  animate={{
                    scale: isPlaying ? [1, 1.15, 1] : 1,
                    opacity: isPlaying ? [0.4, 0.7, 0.4] : 0,
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute w-[80%] max-w-[500px] aspect-square rounded-full blur-[80px] z-0 pointer-events-none"
                  style={{ 
                    background: `url(${currentTrack.thumbnail})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    mixBlendMode: 'screen'
                  }}
                />
                
                {/* Reactive Light Effect (Secondary Pulse) */}
                <motion.div
                  animate={{
                    scale: isPlaying ? [1, 1.25, 1] : 1,
                    opacity: isPlaying ? [0.1, 0.4, 0.1] : 0,
                  }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                  className="absolute w-[75%] max-w-[450px] aspect-square rounded-full blur-[100px] z-0 pointer-events-none bg-m3-primary/40 mix-blend-screen"
                />

                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={cn(
                    "w-full max-w-[340px] md:max-w-[500px] aspect-square rounded-[40px] overflow-hidden shadow-2xl transition-all duration-500 relative z-10",
                    !isPlaying && "scale-95 shadow-none"
                  )}
                >
                  <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-full h-full object-cover" />
                </motion.div>
              </div>

              {/* Right Side: Info & Controls */}
              <div className="mt-8 md:mt-0 flex flex-col justify-end md:justify-center flex-1 md:px-12 pb-4">
                <div className="mb-8 md:mb-12 text-center">
                  <h2 className="text-[28px] md:text-[56px] font-bold text-white tracking-tight leading-tight mb-1">{currentTrack.title}</h2>
                  <p className="text-lg md:text-2xl text-white/70 font-medium">{currentTrack.artist}</p>
                </div>

                <div className="mb-8 max-w-2xl mx-auto md:mx-0 w-full">
                  <input 
                    type="range" 
                    min="0" 
                    max={duration || 100} 
                    value={currentTime} 
                    onChange={handleSeek}
                    className="w-full h-2 md:h-3 bg-white/20 rounded-full appearance-none cursor-pointer accent-m3-primary hover:accent-m3-primary-container transition-all"
                  />
                  <div className="flex justify-between text-xs md:text-sm text-white/50 mt-3 font-medium">
                    <span>{formatDuration(currentTime)}</span>
                    <span>{formatDuration(duration || currentTrack.duration)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center px-4 md:px-0 mb-6 max-w-2xl w-full mx-auto md:mx-0">
                  <button onClick={playPrevious} className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 active:scale-90 transition-all mr-6">
                    <SkipBack className="w-8 h-8 fill-current" />
                  </button>
                  <button 
                    onClick={togglePlay}
                    disabled={isLoading}
                    className="text-m3-on-primary-container bg-m3-primary-container rounded-[32px] w-24 h-24 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center shadow-lg hover:shadow-xl"
                  >
                    {isPlaying && !isLoading ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-2" />}
                  </button>
                  <button onClick={handleTrackEnd} className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 active:scale-90 transition-all ml-6">
                    <SkipForward className="w-8 h-8 fill-current" />
                  </button>
                </div>
                
                <div className="flex items-center justify-center space-x-4 px-2 md:px-0 max-w-sm w-full mx-auto md:mx-0 mb-6 bg-white/5 p-2 rounded-2xl">
                  <button 
                    onClick={toggleAutoPlay}
                    className={cn("w-14 h-14 rounded-xl flex items-center justify-center transition-all", isAutoPlayEnabled ? "text-m3-primary" : "text-white/50 hover:text-white")}
                  >
                    <Infinity className="w-6 h-6" />
                  </button>
                  <button className="w-14 h-14 rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-colors">
                    <ListMusic className="w-6 h-6" />
                  </button>
                  <div className="w-[1px] h-8 bg-white/10 mx-2"></div>
                  <Volume2 className="w-5 h-5 text-white/50 ml-2" />
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={volume} 
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-24 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-m3-primary hover:accent-m3-primary-container transition-all"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

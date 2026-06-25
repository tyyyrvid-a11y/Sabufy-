import React, { useState } from 'react';
import { Home, Search as SearchIcon, Library as LibraryIcon, Menu, Music } from 'lucide-react';
import { cn } from './lib/utils';
import Explore from './views/Explore';
import Search from './views/Search';
import Library from './views/Library';
import PlaylistView from './views/PlaylistView';
import ArtistView from './views/ArtistView';
import UserPlaylistView from './views/UserPlaylistView';
import AudioPlayer from './components/AudioPlayer';
import AddToPlaylistModal from './components/AddToPlaylistModal';
import AuthModal from './components/AuthModal';
import { usePlayerStore } from './store/playerStore';
import { User, LogOut } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useEffect } from 'react';

export default function App() {
  const { currentView, setCurrentView, userPlaylists, user, setUser, syncFromSupabase } = usePlayerStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) syncFromSupabase();
      setIsAuthLoading(false);
    });

    // Listen for changes on auth state (login, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) syncFromSupabase();
      setIsAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUser, syncFromSupabase]);

  const navItems = [
    { id: 'explore', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: SearchIcon },
    { id: 'library', label: 'Library', icon: LibraryIcon },
  ] as const;

  return (
    <div className="flex h-screen bg-m3-surface text-m3-on-surface font-sans overflow-hidden selection:bg-m3-primary/30 relative">

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-m3-surface-container p-6 pb-32 h-full border-r border-white/5 relative z-10">
        <div className="flex items-center gap-2 mb-10 mt-2 pl-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-m3-primary">
            <Music className="w-5 h-5 text-m3-on-primary" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-white">Sabufy</span>
        </div>
        
        <nav className="space-y-6">
          <div>
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setCurrentView({ type: item.id as any })}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-full text-[15px] transition-all font-medium text-left",
                      currentView.type === item.id 
                        ? "bg-m3-secondary-container text-m3-on-secondary-container shadow-sm" 
                        : "text-neutral-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5", currentView.type === item.id ? "text-current" : "text-current")} />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          {userPlaylists.length > 0 && (
            <div className="pt-4 border-t border-white/5">
              <h3 className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest px-4 mb-3">Playlists</h3>
              <ul className="space-y-1 overflow-y-auto max-h-[40vh] hide-scrollbar">
                {userPlaylists.map((playlist) => (
                  <li key={playlist.id}>
                    <button
                      onClick={() => setCurrentView({ type: 'userPlaylist', id: playlist.id })}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-full text-[14px] transition-all font-medium text-left truncate",
                        currentView.type === 'userPlaylist' && currentView.id === playlist.id
                          ? "bg-m3-secondary-container text-m3-on-secondary-container shadow-sm"
                          : "text-neutral-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Music className="w-4 h-4 flex-shrink-0 text-current" />
                      <span className="truncate">{playlist.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
          {isAuthLoading ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-m3-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : user ? (
            <div className="flex items-center justify-between w-full p-2 bg-white/5 rounded-2xl">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-m3-primary flex items-center justify-center text-m3-on-primary font-bold flex-shrink-0">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-m3-on-surface truncate">{user.email}</p>
                </div>
              </div>
              <button 
                onClick={async () => {
                  await supabase.auth.signOut();
                  setUser(null);
                }}
                className="p-2 text-neutral-400 hover:text-white transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-m3-surface-container-high hover:bg-white/10 text-m3-on-surface py-3 rounded-full font-semibold transition-colors"
            >
              <User className="w-5 h-5" />
              Sign In
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative z-10 custom-scrollbar">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-6 py-4 bg-m3-surface/80 backdrop-blur-xl sticky top-0 z-20 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-m3-primary">
               <Music className="w-5 h-5 text-m3-on-primary" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">Sabufy</span>
          </div>
          <div>
            {isAuthLoading ? (
              <div className="p-2 w-9 h-9 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-m3-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : user ? (
              <button 
                onClick={async () => {
                  await supabase.auth.signOut();
                  setUser(null);
                }}
                className="w-8 h-8 rounded-full bg-m3-primary flex items-center justify-center text-m3-on-primary font-bold"
              >
                {user.email?.charAt(0).toUpperCase()}
              </button>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="p-2 text-m3-on-surface bg-m3-surface-container rounded-full"
              >
                <User className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 px-6 md:px-10 pt-6 md:pt-10 max-w-7xl w-full mx-auto pb-32">
          {currentView.type === 'explore' && <Explore />}
          {currentView.type === 'search' && <Search />}
          {currentView.type === 'library' && <Library />}
          {currentView.type === 'playlist' && <PlaylistView id={currentView.id} />}
          {currentView.type === 'artist' && <ArtistView id={currentView.id} />}
          {currentView.type === 'userPlaylist' && <UserPlaylistView id={currentView.id} />}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[80px] bg-m3-surface-container/95 border-t border-white/5 backdrop-blur-2xl flex items-center justify-around px-2 z-30 pb-safe">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView({ type: item.id as any })}
            className="flex flex-col items-center justify-center w-full h-full space-y-1.5 group"
          >
            <div className={cn(
              "px-5 py-1 rounded-full transition-colors", 
              currentView.type === item.id ? "bg-m3-secondary-container text-m3-on-secondary-container" : "text-neutral-400 group-hover:text-neutral-300"
            )}>
              <item.icon className={cn("w-6 h-6", currentView.type === item.id ? "fill-current" : "")} />
            </div>
            <span className={cn(
              "text-[11px] font-medium transition-colors", 
              currentView.type === item.id ? "text-m3-on-surface" : "text-neutral-400"
            )}>{item.label}</span>
          </button>
        ))}
      </nav>

      <AudioPlayer />
      <AddToPlaylistModal />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}

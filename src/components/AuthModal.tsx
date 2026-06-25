import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Mail, Lock, Loader2, LogIn, UserPlus } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser, syncFromSupabase } = usePlayerStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          setUser(data.user);
          await syncFromSupabase();
          onClose();
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        // In many setups, signUp also logs the user in if email confirmation is disabled
        if (data.user) {
          setUser(data.user);
          await syncFromSupabase();
          onClose();
        } else {
          setError('Check your email for the confirmation link.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-m3-surface-container-high w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-m3-on-surface hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <h2 className="text-3xl font-bold text-m3-on-surface mb-2 tracking-tight">
            {isLogin ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-neutral-400 mb-8 text-sm">
            {isLogin 
              ? 'Log in to sync your music library across devices.' 
              : 'Sign up to build your ultimate music collection.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm mb-4">
                {error}
              </div>
            )}
            
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full bg-m3-surface-container hover:bg-white/5 transition-colors text-m3-on-surface placeholder-neutral-500 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-m3-primary/50"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input 
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-m3-surface-container hover:bg-white/5 transition-colors text-m3-on-surface placeholder-neutral-500 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-m3-primary/50"
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-m3-primary text-m3-on-primary py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-m3-primary/90 active:scale-[0.98] transition-all disabled:opacity-70 mt-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isLogin ? (
                <>
                  <LogIn className="w-5 h-5" /> Log In
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" /> Sign Up
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-m3-primary hover:underline text-sm font-medium"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Log in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

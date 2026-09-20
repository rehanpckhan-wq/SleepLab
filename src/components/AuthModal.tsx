import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { LogIn, UserPlus, X, AlertCircle, CheckCircle2, Shield, User, Lock } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const validateInputs = (): boolean => {
    const cleanUser = username.trim();
    const userRegex = /^[a-zA-Z0-9_]+$/;

    if (!cleanUser || cleanUser.length < 3) {
      setErrorMsg('Username must be at least 3 characters long.');
      return false;
    }

    if (!userRegex.test(cleanUser)) {
      setErrorMsg('Username can only contain letters, numbers, and underscores (no spaces or special characters).');
      return false;
    }

    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return false;
    }

    return true;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!validateInputs()) return;

    if (!isSupabaseConfigured() || !supabase) {
      setErrorMsg('Supabase environment variables are missing. Please check your .env.local configuration.');
      return;
    }

    setLoading(true);

    const cleanUsername = username.trim().toLowerCase();
    const virtualEmail = `${cleanUsername}@sleeplab.internal`;

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email: virtualEmail,
          password,
        });
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Invalid username or password. Please check your credentials.');
          }
          throw error;
        }
        setSuccessMsg(`Welcome back, @${cleanUsername}!`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 600);
      } else {
        const { error } = await supabase.auth.signUp({
          email: virtualEmail,
          password,
        });

        if (error) {
          if (error.message.includes('already registered')) {
            throw new Error('This username is already registered. Please sign in instead.');
          }
          throw error;
        }

        setSuccessMsg(`Account @${cleanUsername} created successfully! Signing in...`);
        // Immediately sign in after sign up
        await supabase.auth.signInWithPassword({
          email: virtualEmail,
          password,
        });

        setTimeout(() => {
          onSuccess();
          onClose();
        }, 800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-paper-900/60 backdrop-blur-xs p-4">
      <div className="bg-white border-2 border-paper-300 rounded shadow-xl max-w-md w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200 font-sans">
        <div className="flex items-center justify-between border-b border-paper-200 pb-4">
          <div className="flex items-center gap-2 text-academic-navy">
            <Shield className="w-5 h-5 text-academic-accent" />
            <h2 className="text-lg font-serif font-bold text-paper-900 tracking-tight">
              {mode === 'signin' ? 'Sign In to SleepLab' : 'Create SleepLab Account'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-academic-muted hover:text-paper-900 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isSupabaseConfigured() && (
          <div className="bg-amber-50 border border-amber-300 rounded p-4 text-xs font-mono text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-800">
              <AlertCircle className="w-4 h-4" /> Supabase Not Configured
            </div>
            <p>
              Environment variables <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> are missing.
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded p-3 text-xs font-mono flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded p-3 text-xs font-mono flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border border-paper-300 rounded bg-paper-100 p-1 font-mono text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 rounded transition-colors font-bold ${
              mode === 'signin' ? 'bg-white text-academic-navy shadow-xs' : 'text-academic-muted hover:text-paper-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 rounded transition-colors font-bold ${
              mode === 'signup' ? 'bg-white text-academic-navy shadow-xs' : 'text-academic-muted hover:text-paper-900'
            }`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-academic-muted mb-1">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-academic-muted absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. researcher_01"
                className="w-full pl-9 pr-3 py-2 border border-paper-300 rounded text-sm font-mono text-paper-900 focus:outline-none focus:border-academic-navy"
              />
            </div>
            <p className="text-[11px] font-mono text-academic-muted mt-1">
              Letters, numbers, and underscores only (min 3 chars).
            </p>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-academic-muted mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-academic-muted absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 border border-paper-300 rounded text-sm font-mono text-paper-900 focus:outline-none focus:border-academic-navy"
              />
            </div>
            <p className="text-[11px] font-mono text-academic-muted mt-1">
              At least 6 characters.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !isSupabaseConfigured()}
            className="w-full py-2.5 bg-academic-navy hover:bg-academic-slate text-white text-xs font-mono font-bold rounded transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : mode === 'signin' ? (
              <>
                <LogIn className="w-4 h-4" /> Sign In & Sync Study
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> Register & Sync Study
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

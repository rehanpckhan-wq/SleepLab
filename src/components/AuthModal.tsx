import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateInputs = (): boolean => {
    const cleanUser = username.trim();
    const userRegex = /^[a-zA-Z0-9_]+$/;

    if (!cleanUser || cleanUser.length < 3) {
      setErrorMsg('Username must be at least 3 characters long.');
      return false;
    }

    if (!userRegex.test(cleanUser)) {
      setErrorMsg('Username can only contain letters, numbers, and underscores.');
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
      setErrorMsg('Supabase environment variables are missing.');
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
            throw new Error('Invalid username or password.');
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
            throw new Error('This username is already registered.');
          }
          throw error;
        }

        setSuccessMsg(`Account @${cleanUsername} created successfully! Signing in...`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-xl shadow-lg max-w-md w-full p-6 sm:p-8 space-y-6 font-sans">
        <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="text-lg font-serif font-normal text-[var(--text-primary)] tracking-tight">
              {mode === 'signin' ? 'Sign In to SleepLab' : 'Create Account'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isSupabaseConfigured() && (
          <div className="bg-[var(--warning-soft)] border border-[var(--warning)]/30 rounded-md p-4 text-xs font-sans text-[var(--warning)] space-y-1">
            <div className="font-medium flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> Supabase Not Configured
            </div>
            <p>
              Environment variables <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> are missing.
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="bg-[var(--danger-soft)] border border-[var(--danger)]/30 text-[var(--danger)] rounded-md p-3 text-xs font-sans flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-[var(--success-soft)] border border-[var(--success)]/30 text-[var(--success)] rounded-md p-3 text-xs font-sans flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border border-[var(--border-default)] rounded-md bg-[var(--surface-raised)] p-1 font-sans text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-md transition-all font-medium ${
              mode === 'signin' ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-md transition-all font-medium ${
              mode === 'signup' ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-sans font-medium uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. researcher_01"
                className="w-full pl-9 pr-3 py-2 border border-[var(--border-default)] rounded-md text-xs font-sans bg-[var(--surface-raised)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-sans font-medium uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 border border-[var(--border-default)] rounded-md text-xs font-sans bg-[var(--surface-raised)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isSupabaseConfigured()}
            className="w-full py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-sans font-medium rounded-md transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : mode === 'signin' ? (
              <>
                <LogIn className="w-4 h-4" /> Sign In & Sync
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> Register & Sync
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

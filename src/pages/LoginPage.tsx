import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { PlaySquare, LogIn, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isSupabaseConfigured } from '../lib/supabaseClient';

export const LoginPage: React.FC = () => {
  const { session, isLoading, signInWithGoogle } = useAuth();
  const { showToast } = useToast();
  const [isSigningIn, setIsSigningIn] = useState(false);

  if (!isLoading && session) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch (err: any) {
      showToast('Sign-in Failed', err?.message || 'Unable to start Google sign-in.', 'error');
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12">
      <div className="w-full max-w-sm glass-card p-8 rounded-3xl border border-slate-800 text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 p-0.5 shadow-lg shadow-indigo-600/30">
            <div className="w-full h-full bg-[#0a0e17] rounded-[14px] flex items-center justify-center">
              <PlaySquare className="w-7 h-7 text-indigo-400" />
            </div>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-white">Welcome to VidSetu</h1>
          <p className="text-sm text-slate-400 mt-2">
            Sign in to create or join a Watch Space and start browsing.
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-left">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200 leading-relaxed">
              Supabase isn't configured yet. Set <code className="font-mono">VITE_SUPABASE_URL</code> and{' '}
              <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> in <code className="font-mono">.env</code>.
            </p>
          </div>
        )}

        <button
          onClick={handleSignIn}
          disabled={isSigningIn || !isSupabaseConfigured}
          className="w-full inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-xl transition-all disabled:opacity-60"
        >
          <LogIn className="w-5 h-5 text-indigo-600" />
          <span>{isSigningIn ? 'Redirecting to Google...' : 'Continue with Google'}</span>
        </button>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          By continuing you agree to VidSetu's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

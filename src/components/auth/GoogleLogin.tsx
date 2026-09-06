import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, ShieldCheck, ChevronDown } from 'lucide-react';

export const GoogleLogin: React.FC = () => {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs text-slate-400 animate-pulse">
        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>
        Connecting...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => login()}
          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 hover:from-indigo-500 hover:to-sky-400 active:scale-95 transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 border border-indigo-400/30"
        >
          {/* Google Icon */}
          <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center p-0.5 shrink-0">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>
          <span>Continue with Google</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition-all text-left"
      >
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            className="w-8 h-8 rounded-lg object-cover ring-2 ring-indigo-500/40"
          />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
            {user.name?.charAt(0) || 'U'}
          </div>
        )}
        <div className="hidden md:block">
          <p className="text-xs font-semibold text-slate-100 truncate max-w-[120px]">
            {user.name}
          </p>
          <div className="flex items-center gap-1 text-[10px] text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Connected
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
      </button>

      {dropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setDropdownOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 p-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 animate-fadeIn">
            <div className="p-3 border-b border-slate-800 mb-1">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-1 rounded-lg">
                <ShieldCheck className="w-3.5 h-3.5" />
                Account Connected
              </div>
            </div>

            <button
              onClick={() => {
                setDropdownOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors mt-1"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
};

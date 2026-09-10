import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PlaySquare, Search, ChevronDown, LogOut, Users, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWatchSpace } from '../../context/WatchSpaceContext';

const NAV_LINKS = [
  { name: 'Home', path: '/' },
  { name: 'Movies', path: '/movies' },
  { name: 'TV Shows', path: '/tv-shows' },
];

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, profile, signOut } = useAuth();
  const { spaces, currentSpace, setCurrentSpaceId } = useWatchSpace();

  const [query, setQuery] = useState('');
  const [showSpaceMenu, setShowSpaceMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#0a0e17]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 p-0.5 shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#0a0e17] rounded-[10px] flex items-center justify-center">
              <PlaySquare className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
            </div>
          </div>
          <span className="text-lg font-black tracking-tight text-white hidden sm:block">VidSetu</span>
        </Link>

        {session && (
          <nav className="hidden lg:flex items-center gap-1 flex-shrink-0">
            {NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        )}

        {session && (
          <form onSubmit={handleSearch} className="relative flex-1 max-w-md hidden md:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies and TV shows..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/70 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/60"
            />
          </form>
        )}

        <div className="flex-1 md:flex-none" />

        {session ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            {spaces.length > 0 && (
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setShowSpaceMenu((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800/60 border border-slate-800"
                >
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="max-w-[120px] truncate">{currentSpace?.name || 'Select Space'}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {showSpaceMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
                    {spaces.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setCurrentSpaceId(s.id);
                          setShowSpaceMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-medium ${
                          s.id === currentSpace?.id ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                    <Link
                      to="/spaces"
                      onClick={() => setShowSpaceMenu(false)}
                      className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-indigo-400 hover:bg-slate-800 border-t border-slate-800"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Manage Spaces
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div className="relative">
              <button onClick={() => setShowUserMenu((v) => !v)} className="flex items-center gap-2">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" className="w-9 h-9 rounded-full border border-slate-700" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                    {(profile?.name || profile?.email || '?')[0]?.toUpperCase()}
                  </div>
                )}
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-800">
                    <p className="text-xs font-semibold text-white truncate">{profile?.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{profile?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-rose-400 hover:bg-slate-800"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
};

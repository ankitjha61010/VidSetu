import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GoogleLogin } from '../auth/GoogleLogin';
import { PlaySquare, UploadCloud, Film } from 'lucide-react';

export const Header: React.FC = () => {
  const location = useLocation();

  const navLinks = [
    { name: 'Library', path: '/videos', icon: Film },
    { name: 'Upload', path: '/upload', icon: UploadCloud },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#0a0e17]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 p-0.5 shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#0a0e17] rounded-[10px] flex items-center justify-center">
              <PlaySquare className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              VidSetu
            </span>
            <span className="text-[10px] text-slate-400 font-medium -mt-1 hidden sm:block">
              Fast & Private File Sharing
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-2xl border border-slate-800/80">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Auth / Profile section */}
        <div className="flex items-center gap-3">
          <GoogleLogin />
        </div>
      </div>
    </header>
  );
};

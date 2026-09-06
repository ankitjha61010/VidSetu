import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  UploadCloud,
  Film,
  HardDrive,
  Shield,
  Zap,
  Clock,
  QrCode,
  ArrowRight,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { isAuthenticated, login } = useAuth();

  const features = [
    {
      icon: HardDrive,
      title: 'Google Drive Storage',
      desc: 'All videos are stored directly in your designated Google Drive folder. Zero intermediate servers or custom backends.',
    },
    {
      icon: Zap,
      title: '6 GB Resumable Uploads',
      desc: 'Chunked multi-part uploads with pause/resume, speed indicators, network retry, and no JavaScript heap overload.',
    },
    {
      icon: Clock,
      title: '5-Hour Ephemeral Lifespan',
      desc: 'Automated 5-hour access expiration model with live countdown timers and client-side cleanup garbage collection.',
    },
    {
      icon: QrCode,
      title: 'Instant QR Code Sharing',
      desc: 'One-click QR code generation and direct watch links formatted for static Netlify hosting and clean SPA URLs.',
    },
    {
      icon: Shield,
      title: 'Privacy & Security',
      desc: 'No client secrets in frontend source code, scoped Google Drive OAuth permissions, and secure token lifecycle.',
    },
    {
      icon: Film,
      title: 'Pro Video Player',
      desc: 'Custom responsive video player with 1x-2.5x centering zoom, custom volume/audio, keyboard hotkeys, and PiP.',
    },
  ];

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative pt-8 pb-12 sm:pt-16 sm:pb-20 text-center overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-600/20 via-sky-500/20 to-purple-600/20 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 mb-6 animate-pulse-subtle">
          <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
          Pure Frontend Architecture • Netlify Ready • Powered by Google Drive
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] max-w-4xl mx-auto">
          Share & Stream Videos Directly via{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-200">
            Google Drive
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Upload up to 6 GB videos with resumable chunking, enjoy precision zoom playback, generate instant shareable QR codes, and maintain private 5-hour lifespans.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          {isAuthenticated ? (
            <>
              <Link
                to="/upload"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-bold text-base shadow-xl shadow-indigo-600/30 hover:shadow-indigo-500/50 hover:scale-105 active:scale-95 transition-all border border-indigo-400/30"
              >
                <UploadCloud className="w-5 h-5" />
                <span>Upload Video (6 GB)</span>
              </Link>
              <Link
                to="/videos"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-slate-850 hover:bg-slate-800 text-slate-100 font-bold text-base border border-slate-700 hover:border-slate-600 transition-all shadow-lg"
              >
                <Film className="w-5 h-5 text-indigo-400" />
                <span>Video Library</span>
              </Link>
            </>
          ) : (
            <button
              onClick={() => login()}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-bold text-base shadow-xl shadow-indigo-600/30 hover:shadow-indigo-500/50 hover:scale-105 active:scale-95 transition-all border border-indigo-400/30"
            >
              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center p-0.5 shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>Get Started with Google</span>
              <ArrowRight className="w-5 h-5 ml-0.5" />
            </button>
          )}
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Engineered for Performance & Privacy
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            A comprehensive overview of VidSetu frontend capabilities
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="glass-panel p-7 rounded-3xl border border-slate-800 hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 space-y-4 group bg-slate-900/40"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-200 transition-colors">{feat.title}</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

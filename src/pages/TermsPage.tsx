import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <div className="flex items-center gap-2">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="glass-card p-8 sm:p-12 rounded-3xl border border-slate-800 space-y-8">
        <div className="space-y-3 pb-6 border-b border-slate-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-semibold border border-sky-500/20">
            <FileText className="w-3.5 h-3.5" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Terms of Service for VidSetu</h1>
          <p className="text-sm text-slate-400">Last updated: September 10, 2026</p>
        </div>

        <div className="space-y-6 text-sm sm:text-base text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing and using VidSetu, you agree to comply with and be bound by these Terms of Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. Content & Playback</h2>
            <p>
              Movie and TV metadata displayed in VidSetu is provided by The Movie Database (TMDB) and TVmaze and remains the property of its respective rights holders. VidSetu does not host, store, or stream full copyrighted movies or TV episodes; the "Play" action streams the title's official trailer via an embedded YouTube player.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. Watch Spaces</h2>
            <p>
              A Watch Space is a personal or shared collection of saved titles and watch history that you create and control. The number of members you can add to a Watch Space is limited by your subscription plan. You are responsible for the members you invite to your Watch Space.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Disclaimer of Warranties</h2>
            <p>
              VidSetu is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind. Metadata accuracy and availability depend on third-party APIs (TMDB, TVmaze, YouTube) outside VidSetu's control.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

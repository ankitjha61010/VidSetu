import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Lock, FileText, CheckCircle2 } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
            <Shield className="w-3.5 h-3.5" />
            <span>Legal & Privacy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Privacy Policy for VidSetu</h1>
          <p className="text-sm text-slate-400">Last updated: September 10, 2026</p>
        </div>

        <div className="space-y-6 text-sm sm:text-base text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              1. Overview & Architecture
            </h2>
            <p>
              VidSetu ("we", "our", or "the application") is a movie & TV discovery platform. Movie and TV metadata (titles, posters, descriptions, cast, ratings) is sourced from The Movie Database (TMDB) and TVmaze. Trailer playback is provided via embedded YouTube players. VidSetu does not host, store, or stream any copyrighted movie or TV show files itself.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              2. Account & Sign-In
            </h2>
            <p>
              VidSetu requires you to sign in with your Google account (via Supabase Authentication) to create or join a "Watch Space" and save a personal watchlist and watch history. We store your name, email address, and profile picture URL as provided by Google, plus the Watch Space, watchlist, and watch history data you create while using the app.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              3. Data Storage & Third Parties
            </h2>
            <p>
              Account and Watch Space data is stored in Supabase (a hosted PostgreSQL provider), protected by row-level security so only members of a Watch Space can see its contents. Movie/TV metadata requests are sent to TMDB and TVmaze's public APIs. Trailer playback loads an embedded YouTube player, which is subject to YouTube's own privacy practices. We do not sell your data to any third party.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              4. Google API Services User Data Policy Compliance
            </h2>
            <p>
              VidSetu's use and transfer of information received from Google APIs (via Google Sign-In) adheres to the{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline font-semibold"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">5. Contact & Support</h2>
            <p>
              If you have questions regarding this Privacy Policy or wish to request deletion of your account data, you may email developer support at{' '}
              <a href="mailto:abhikashyap2698@gmail.com" className="text-indigo-400 hover:underline font-semibold">
                abhikashyap2698@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

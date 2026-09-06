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
          <p className="text-sm text-slate-400">Last updated: September 6, 2026</p>
        </div>

        <div className="space-y-6 text-sm sm:text-base text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              1. Overview & Architecture
            </h2>
            <p>
              VidSetu ("we", "our", or "the application") is a <strong>client-side, frontend-only video streaming and sharing platform</strong>. VidSetu does not own, run, or operate any custom backend database or intermediate media server. All user video data is stored exclusively in the user's personal Google Drive account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              2. Google User Data & OAuth Permissions
            </h2>
            <p>
              VidSetu uses Google OAuth 2.0 to request access to the user's Google Drive. We strictly use these permissions for:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-300">
              <li>Reading and streaming movie and video files stored in your selected Google Drive folders (<code className="text-indigo-300 bg-slate-800 px-1 py-0.5 rounded">VidSetu_Videos</code> and <code className="text-indigo-300 bg-slate-800 px-1 py-0.5 rounded">VidSetu_Uploads</code>).</li>
              <li>Uploading user-selected video files directly from your browser to your Google Drive via resumable upload streams.</li>
              <li>Displaying your account profile name and avatar to verify your connection status.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              3. Data Retention & Third-Party Sharing
            </h2>
            <p>
              <strong>We never store, log, track, or share your videos, OAuth access tokens, or personal identifiers on any external third-party server.</strong> Your Google OAuth tokens remain strictly inside your browser's local storage session (<code className="text-slate-200">sessionStorage</code> / <code className="text-slate-200">localStorage</code>) and are sent solely to Google's official Drive API endpoints over HTTPS.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              4. Google API Services User Data Policy Compliance
            </h2>
            <p>
              VidSetu's use and transfer to any other app of information received from Google APIs adheres to the{' '}
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
              If you have questions regarding this Privacy Policy or wish to revoke access, you may disconnect your Google Account at any time via the application header or by emailing developer support at{' '}
              <a href="mailto:abhishek61010@gmail.com" className="text-indigo-400 hover:underline font-semibold">
                abhishek61010@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

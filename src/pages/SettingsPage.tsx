import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DriveFolderSelector } from '../components/settings/DriveFolderSelector';
import {
  Key,
  Shield,
  Trash2,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { clientId, setCustomClientId, user, isAuthenticated, logout } = useAuth();
  const { showToast } = useToast();

  const [inputClientId, setInputClientId] = useState(clientId || '');
  const [saved, setSaved] = useState(false);

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomClientId(inputClientId.trim());
    setSaved(true);
    showToast('Client ID Updated', 'Google OAuth Client ID configuration saved.', 'success');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Configuration & Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Configure Google Drive OAuth client credentials, target storage folders, and frontend privacy settings.
        </p>
      </div>

      {/* Google Drive Storage Folder Component */}
      <DriveFolderSelector />

      {/* Google OAuth Credentials Section */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Google OAuth 2.0 Client Configuration</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
              VidSetu runs completely in your browser. You can supply a custom Google OAuth Web Client ID directly in this input or via the Netlify build environment variable{' '}
              <code className="text-indigo-300 font-mono">VITE_GOOGLE_CLIENT_ID</code>.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveClientId} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Google Web Client ID
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={inputClientId}
                onChange={(e) => setInputClientId(e.target.value)}
                placeholder="e.g. 1234567890-abcdef.apps.googleusercontent.com"
                className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
              >
                {saved ? 'Saved!' : 'Save Client ID'}
              </button>
            </div>
          </div>
        </form>

        {/* Security & Netlify Guide Notice */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-2 text-indigo-300 font-semibold">
            <Shield className="w-4 h-4" />
            <span>Zero-Credential Exposure Guarantee</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Google Client IDs are public identifiers for SPA token authorization. <strong>Never</strong> provide a client secret or service account private key in this frontend. For production deployment on Netlify, add your Netlify site URL (e.g.{' '}
            <span className="font-mono text-slate-300">https://your-site.netlify.app</span>) under <strong>Authorized JavaScript Origins</strong> in your Google Cloud Console.
          </p>
        </div>
      </div>

      {/* Account & Session Status */}
      {isAuthenticated && user && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {user.picture ? (
              <img src={user.picture} alt={user.name} className="w-12 h-12 rounded-2xl ring-2 ring-indigo-500/30" />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold">
                {user.name.charAt(0)}
              </div>
            )}
            <div>
              <h4 className="text-base font-bold text-white">{user.name}</h4>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Disconnect Session</span>
          </button>
        </div>
      )}
    </div>
  );
};

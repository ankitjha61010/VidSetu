import React, { useState, useEffect } from 'react';
import { useDrive } from '../../context/DriveContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Folder, CheckCircle, RefreshCw, Plus, FolderCheck, HardDrive } from 'lucide-react';
import { driveApi } from '../../services/driveApi';
import { DriveFolder } from '../../types';

export const DriveFolderSelector: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { activeFolder, selectFolder, setFolderManually } = useDrive();
  const { showToast } = useToast();

  const [availableFolders, setAvailableFolders] = useState<DriveFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [customFolderId, setCustomFolderId] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const loadFolders = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const folders = await driveApi.listUserFolders();
      setAvailableFolders(folders);
    } catch (err: any) {
      console.warn('Could not load user folders:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadFolders();
    }
  }, [isAuthenticated]);

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFolderId.trim()) return;
    try {
      await setFolderManually(customFolderId.trim());
      showToast('Storage Folder Set', 'Target Google Drive folder updated.', 'success');
      setShowManualInput(false);
      setCustomFolderId('');
    } catch (err: any) {
      showToast('Error', err.message || 'Invalid Folder ID or access denied', 'error');
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Google Drive Video Folder</h3>
            <p className="text-xs text-slate-400">
              All uploaded videos will be saved to this folder in your personal Google Drive
            </p>
          </div>
        </div>

        {isAuthenticated && (
          <button
            onClick={loadFolders}
            disabled={loading}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 transition-colors"
            title="Refresh folder list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        )}
      </div>

      {/* Current Active Folder Banner */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
            <FolderCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Active Storage:</span>
              <span className="text-sm font-semibold text-white">
                {activeFolder?.name || 'VidSetu_Videos (Default)'}
              </span>
            </div>
            {activeFolder?.id && (
              <p className="text-[11px] font-mono text-slate-500 mt-0.5 select-all">
                ID: {activeFolder.id}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3.5 h-3.5" />
            Connected
          </span>
        </div>
      </div>

      {/* Folder Selection List */}
      {availableFolders.length > 0 && (
        <div className="space-y-3 mb-6">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
            Select an existing Drive folder
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {availableFolders.map((f) => {
              const isSelected = activeFolder?.id === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => selectFolder(f)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500/40 text-white'
                      : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/50 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Folder className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span className="text-xs font-medium truncate">{f.name}</span>
                  </div>
                  {isSelected && <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Folder ID Form */}
      <div>
        {!showManualInput ? (
          <button
            onClick={() => setShowManualInput(true)}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Specify custom Drive Folder ID manually
          </button>
        ) : (
          <form onSubmit={handleManualSave} className="space-y-3 pt-2">
            <label className="text-xs text-slate-300 block font-medium">
              Enter Google Drive Folder ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 1a2b3c4d5e6f7g8h9i0j..."
                value={customFolderId}
                onChange={(e) => setCustomFolderId(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Set
              </button>
              <button
                type="button"
                onClick={() => setShowManualInput(false)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

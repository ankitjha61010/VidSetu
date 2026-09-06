import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { driveApi } from '../services/driveApi';
import { expirationService } from '../services/expirationService';
import { qrService } from '../services/qrService';
import { googleAuth } from '../services/googleAuth';
import { VideoPlayer } from '../components/player/VideoPlayer';
import { ExpiredVideo } from '../components/player/ExpiredVideo';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { ExpirationTimer } from '../components/common/ExpirationTimer';
import { CopyLinkButton } from '../components/common/CopyLinkButton';
import { QRModal } from '../components/common/QRModal';
import { VideoMetadata } from '../types';
import {
  Calendar,
  HardDrive,
  QrCode,
  ArrowLeft,
  ShieldCheck,
  Download,
  FileCode,
  FileArchive,
  FileText,
  File,
  Loader2,
} from 'lucide-react';

export const WatchPage: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const [video, setVideo] = useState<VideoMetadata | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);

  useEffect(() => {
    if (!videoId) {
      setError('Invalid or missing file ID.');
      setIsLoading(false);
      return;
    }

    const loadVideo = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const meta = await driveApi.getVideoMetadata(videoId);
        setVideo(meta);

        // Check 3-day expiration
        const timeCheck = expirationService.getTimeRemaining(meta.expiresAt);
        if (timeCheck.isExpired || meta.isExpired) {
          setIsExpired(true);
        }
      } catch (err: any) {
        console.error('Watch video error:', err);
        setError(err.message || 'Unable to locate or download file.');
      } finally {
        setIsLoading(false);
      }
    };

    loadVideo();
  }, [videoId]);

  if (isLoading) {
    return (
      <div className="py-24">
        <LoadingState
          message="Loading File Details..."
          subMessage="Fetching file metadata"
          size="lg"
        />
      </div>
    );
  }

  if (isExpired) {
    return <ExpiredVideo videoTitle={video?.name} expiredAt={video?.expiresAt} />;
  }

  if (error || !video) {
    return (
      <div className="py-12">
        <ErrorState
          title="File Unavailable"
          message={error || 'File not found or permissions are required.'}
          actionText="Back to Home"
          onRetry={() => (window.location.href = '/')}
        />
      </div>
    );
  }

  const watchUrl = qrService.getWatchUrl(video.id);

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  // Helper to determine if file is a playable video format
  const fileName = (video.originalFileName || video.name || '').toLowerCase();
  const mimeType = (video.mimeType || '').toLowerCase();
  const isVideoFile =
    mimeType.startsWith('video/') ||
    /\.(mp4|mkv|webm|mov|avi|m4v|3gp|wmv|flv|ts|mpg|mpeg)$/i.test(fileName);

  // File type icon selector
  const renderFileIcon = () => {
    if (fileName.endsWith('.apk')) {
      return (
        <div className="w-24 h-24 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <FileCode className="w-12 h-12" />
        </div>
      );
    }
    if (fileName.match(/\.(zip|rar|7z|tar|gz|bz2)$/i)) {
      return (
        <div className="w-24 h-24 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <FileArchive className="w-12 h-12" />
        </div>
      );
    }
    if (fileName.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i)) {
      return (
        <div className="w-24 h-24 rounded-3xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
          <FileText className="w-12 h-12" />
        </div>
      );
    }
    return (
      <div className="w-24 h-24 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
        <File className="w-12 h-12" />
      </div>
    );
  };

  // Direct authenticated download handler (avoids Google anti-bot automated queries error page)
  const handleDownloadFile = async () => {
    try {
      setIsDownloading(true);
      let downloaded = false;

      // 1. Try direct authorized Google Drive v3 media fetch
      try {
        const token = await googleAuth.getValidAccessToken();
        if (token) {
          const res = await fetch(`https://www.googleapis.com/drive/v3/files/${video.driveFileId}?alt=media`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.ok) {
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = video.originalFileName || video.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
            downloaded = true;
          }
        }
      } catch (err) {
        console.warn('Authenticated blob download fallback:', err);
      }

      // 2. Fallback to webContentLink if authenticated fetch did not trigger
      if (!downloaded) {
        const downloadUrl = video.webContentLink || `https://drive.google.com/uc?export=download&id=${video.driveFileId}`;
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = video.originalFileName || video.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (e) {
      console.error('Download trigger error:', e);
      if (video.webContentLink) {
        window.location.href = video.webContentLink;
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top back navigation */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/videos"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </Link>

        {/* Only show countdown timer if file actually has a temporary expiration (3 days) */}
        {video.expiresAt && video.expiresAt < video.createdAt + 10 * 24 * 60 * 60 * 1000 && (
          <ExpirationTimer
            expiresAt={video.expiresAt}
            onExpire={() => setIsExpired(true)}
          />
        )}
      </div>

      {/* Media or Universal File Download Container */}
      {isVideoFile ? (
        <div className="w-full">
          <VideoPlayer video={video} />
        </div>
      ) : (
        <div className="glass-card p-10 sm:p-14 rounded-3xl border border-slate-800 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex justify-center mb-6">{renderFileIcon()}</div>

          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-3">
            FILE READY FOR DOWNLOAD
          </span>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 max-w-xl mx-auto break-all">
            {video.originalFileName || video.name}
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm text-slate-400 mb-8">
            <span className="font-semibold text-slate-200">{formatFileSize(video.size)}</span>
            <span>•</span>
            <span className="font-mono text-indigo-300">{video.mimeType || 'Application/File'}</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">Active for 3 Days</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleDownloadFile}
              disabled={isDownloading}
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base shadow-xl shadow-indigo-600/40 hover:shadow-indigo-500/60 hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Preparing Download...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Download File ({formatFileSize(video.size)})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Video / File Details & Interaction Panel */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="min-w-0 space-y-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white truncate" title={video.originalFileName || video.name}>
              {video.originalFileName || video.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Uploaded {new Date(video.createdAt).toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                {formatFileSize(video.size)}
              </span>
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono text-[11px] border border-indigo-500/20">
                {video.mimeType}
              </span>
            </div>
          </div>

          {/* Quick Sharing Toolbar */}
          <div className="flex items-center gap-2 self-start lg:self-auto">
            {isVideoFile && (
              <button
                onClick={handleDownloadFile}
                disabled={isDownloading}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            )}

            <CopyLinkButton url={watchUrl} label="Copy Link" />

            <button
              onClick={() => setShowQRModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-colors"
            >
              <QrCode className="w-4 h-4 text-indigo-400" />
              <span>QR Code</span>
            </button>
          </div>
        </div>

        {/* Expiration Notice Bar - only for temporary uploads (3 days) */}
        {video.expiresAt && video.expiresAt < video.createdAt + 10 * 24 * 60 * 60 * 1000 && (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 text-xs">
            <div className="flex items-center gap-2.5 text-indigo-300">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                This link and file are active for <strong>3 days (72 hours)</strong> from upload time. After expiration, the file is automatically and permanently deleted from cloud storage.
              </span>
            </div>
          </div>
        )}
      </div>

      {showQRModal && (
        <QRModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          videoId={video.id}
          videoTitle={video.originalFileName || video.name}
        />
      )}
    </div>
  );
};

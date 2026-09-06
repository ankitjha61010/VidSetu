import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { driveApi } from '../services/driveApi';
import { expirationService } from '../services/expirationService';
import { qrService } from '../services/qrService';
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
} from 'lucide-react';

export const WatchPage: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const [video, setVideo] = useState<VideoMetadata | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);

  useEffect(() => {
    if (!videoId) {
      setError('Invalid or missing video ID.');
      setIsLoading(false);
      return;
    }

    const loadVideo = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const meta = await driveApi.getVideoMetadata(videoId);
        setVideo(meta);

        // Check 5-hour expiration
        const timeCheck = expirationService.getTimeRemaining(meta.expiresAt);
        if (timeCheck.isExpired || meta.isExpired) {
          setIsExpired(true);
        }
      } catch (err: any) {
        console.error('Watch video error:', err);
        setError(err.message || 'Unable to locate or stream video from Google Drive.');
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
          message="Loading Video from Google Drive..."
          subMessage="Verifying 5-hour access expiration metadata"
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
          title="Video Unavailable"
          message={error || 'Video file not found or Google Drive permissions are required.'}
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

        {/* Only show 5-hour countdown timer if video actually has a temporary expiration */}
        {video.expiresAt && video.expiresAt < video.createdAt + 24 * 60 * 60 * 1000 && (
          <ExpirationTimer
            expiresAt={video.expiresAt}
            onExpire={() => setIsExpired(true)}
          />
        )}
      </div>

      {/* Main Video Player Container */}
      <div className="w-full">
        <VideoPlayer video={video} />
      </div>

      {/* Video Details & Interaction Panel */}
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
            <CopyLinkButton url={watchUrl} />

            <button
              onClick={() => setShowQRModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-colors"
            >
              <QrCode className="w-4 h-4 text-indigo-400" />
              <span>QR Code</span>
            </button>
          </div>
        </div>

        {/* Expiration Notice Bar - only for temporary uploads */}
        {video.expiresAt && video.expiresAt < video.createdAt + 24 * 60 * 60 * 1000 && (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 text-xs">
            <div className="flex items-center gap-2.5 text-indigo-300">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                This video is accessible for <strong>5 hours</strong> from upload time. After expiration, links and player playback automatically lock.
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

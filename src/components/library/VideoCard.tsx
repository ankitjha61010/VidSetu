import React, { useState } from 'react';
import { VideoMetadata } from '../../types';
import { ExpirationTimer } from '../common/ExpirationTimer';
import { CopyLinkButton } from '../common/CopyLinkButton';
import { DownloadButton } from '../common/DownloadButton';
import { QRModal } from '../common/QRModal';
import { qrService } from '../../services/qrService';
import {
  Play,
  QrCode,
  Trash2,
  Calendar,
  Film,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface VideoCardProps {
  video: VideoMetadata;
  onDelete: (fileId: string) => Promise<void>;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isExpired, setIsExpired] = useState(video.isExpired || Date.now() > video.expiresAt);

  const watchUrl = qrService.getWatchUrl(video.id);

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (ms: number): string => {
    return new Date(ms).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = async () => {
    if (window.confirm(`Delete "${video.originalFileName || video.name}" from Google Drive?`)) {
      setIsDeleting(true);
      try {
        await onDelete(video.driveFileId);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div
      className={`glass-panel rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col group ${
        isExpired
          ? 'border-rose-950/40 bg-slate-950/40 opacity-75'
          : 'border-slate-800 hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/5'
      }`}
    >
      {/* Thumbnail or Video Cover */}
      <div className="relative aspect-video w-full bg-slate-950 overflow-hidden flex items-center justify-center">
        {video.thumbnailLink ? (
          <img
            src={video.thumbnailLink}
            alt={video.name}
            referrerPolicy="no-referrer"
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              isExpired ? 'grayscale contrast-75' : ''
            }`}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-600 group-hover:text-indigo-400/80 transition-colors">
            <Film className="w-10 h-10" />
          </div>
        )}

        {/* Hover / Direct Play overlay if not expired */}
        {!isExpired ? (
          <Link
            to={`/watch/${video.id}`}
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-xs"
          >
            <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/50 transform group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
          </Link>
        ) : (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-3 text-center">
            <AlertCircle className="w-7 h-7 text-rose-400 mb-1" />
            <span className="text-xs font-bold text-rose-300">This video has expired.</span>
          </div>
        )}

        {/* Floating Expiration Badge */}
        <div className="absolute top-2.5 right-2.5">
          <ExpirationTimer
            expiresAt={video.expiresAt}
            onExpire={() => setIsExpired(true)}
          />
        </div>

        {/* File size tag */}
        <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[11px] font-mono font-medium text-slate-200">
          {formatFileSize(video.size)}
        </div>
      </div>

      {/* Video Content Metadata */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h4
            className="text-sm font-bold text-white line-clamp-1 group-hover:text-indigo-300 transition-colors"
            title={video.originalFileName || video.name}
          >
            {video.originalFileName || video.name}
          </h4>

          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1.5">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              {formatDate(video.createdAt)}
            </span>
          </div>
        </div>

        {/* Action Button Row */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
          {!isExpired ? (
            <>
              <Link
                to={`/watch/${video.id}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Watch</span>
              </Link>

              <div className="flex items-center gap-1">
                <CopyLinkButton url={watchUrl} variant="icon" />

                <button
                  onClick={() => setShowQRModal(true)}
                  className="p-2 rounded-lg text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 transition-colors"
                  title="Generate QR Code"
                >
                  <QrCode className="w-4 h-4 text-indigo-400" />
                </button>

                <DownloadButton video={video} variant="icon" />

                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 bg-slate-800/80 hover:bg-rose-500/10 border border-slate-700/60 transition-colors disabled:opacity-50"
                  title="Delete from Google Drive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            /* Expired state action row */
            <div className="w-full flex items-center justify-between text-xs text-rose-400">
              <span className="text-[11px] italic">Access disabled</span>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Expired File</span>
              </button>
            </div>
          )}
        </div>
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

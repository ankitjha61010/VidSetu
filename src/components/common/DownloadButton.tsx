import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { driveApi } from '../../services/driveApi';
import { useToast } from '../../context/ToastContext';
import { VideoMetadata } from '../../types';

interface DownloadButtonProps {
  video: VideoMetadata;
  className?: string;
  variant?: 'button' | 'icon' | 'player';
  disabled?: boolean;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  video,
  className = '',
  variant = 'button',
  disabled = false,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const { showToast } = useToast();

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled || video.isExpired) {
      showToast('Video Expired', 'This video has reached its 5-hour limit and cannot be downloaded.', 'warning');
      return;
    }

    setDownloading(true);
    setDownloadProgress(0);
    try {
      showToast('Preparing Download', `Fetching "${video.originalFileName || video.name}"...`, 'info', 3000);

      // If file is smaller than 250MB we can download as blob, or trigger direct Drive webContentLink
      if (video.size < 250 * 1024 * 1024) {
        const blob = await driveApi.getVideoStreamBlob(video.driveFileId, (percent) => {
          setDownloadProgress(percent);
        });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = video.originalFileName || video.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // Direct stream download link
        if (video.webContentLink) {
          window.open(video.webContentLink, '_blank');
        } else {
          const blob = await driveApi.getVideoStreamBlob(video.driveFileId);
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = video.originalFileName || video.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
      }

      showToast('Download Started', 'Your video file is downloading.', 'success');
    } catch (err: any) {
      console.error('Download error:', err);
      showToast('Download Failed', err.message || 'Unable to download file from Google Drive.', 'error');
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleDownload}
        disabled={disabled || downloading || video.isExpired}
        title={downloading ? `Downloading ${downloadProgress}%` : 'Download Video'}
        className={`p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        aria-label="Download Video"
      >
        {downloading ? (
          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
      </button>
    );
  }

  if (variant === 'player') {
    return (
      <button
        onClick={handleDownload}
        disabled={disabled || downloading || video.isExpired}
        className={`p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-40 ${className}`}
        title="Download Video"
      >
        {downloading ? (
          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
        ) : (
          <Download className="w-5 h-5" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleDownload}
      disabled={disabled || downloading || video.isExpired}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white border border-slate-700 hover:border-slate-600 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {downloading ? (
        <>
          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
          <span>{downloadProgress > 0 ? `${downloadProgress}%` : 'Downloading...'}</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span>Download</span>
        </>
      )}
    </button>
  );
};

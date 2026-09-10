import React, { useEffect, useState } from 'react';
import { X, Download, QrCode } from 'lucide-react';
import { qrService } from '../../services/qrService';
import { CopyLinkButton } from './CopyLinkButton';
import { LoadingState } from './LoadingState';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
}

export const QRModal: React.FC<QRModalProps> = ({
  isOpen,
  onClose,
  url,
  title,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen && url) {
      setLoading(true);
      qrService
        .generateQRDataUrl(url)
        .then((dataUrl) => {
          setQrDataUrl(dataUrl);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [isOpen, url]);

  if (!isOpen) return null;

  const handleDownloadQR = () => {
    if (qrDataUrl) {
      qrService.downloadQRImage(qrDataUrl, 'vidsetu-qr.png');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Scan & Share</h3>
              <p className="text-xs text-slate-400 truncate max-w-[240px]">
                {title || 'Scan to open on mobile'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close QR Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Body */}
        <div className="my-6 flex flex-col items-center justify-center">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <LoadingState message="Generating QR Code..." size="sm" />
            </div>
          ) : (
            <div className="p-4 bg-white rounded-2xl shadow-xl flex items-center justify-center">
              <img
                src={qrDataUrl}
                alt="Watch Video QR Code"
                className="w-56 h-56 object-contain rounded-lg"
              />
            </div>
          )}

          <div className="mt-4 text-center px-4">
            <p className="text-xs text-slate-400 mb-1">Link</p>
            <p className="text-xs font-mono text-indigo-300 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 truncate max-w-xs select-all">
              {url}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <CopyLinkButton url={url} className="w-full text-xs" />
          <button
            onClick={handleDownloadQR}
            disabled={loading || !qrDataUrl}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Download QR</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { expirationService, ExpirationTimeRemaining } from '../../services/expirationService';

interface ExpirationTimerProps {
  expiresAt: number;
  className?: string;
  onExpire?: () => void;
  showIcon?: boolean;
}

export const ExpirationTimer: React.FC<ExpirationTimerProps> = ({
  expiresAt,
  className = '',
  onExpire,
  showIcon = true,
}) => {
  const [time, setTime] = useState<ExpirationTimeRemaining>(
    expirationService.getTimeRemaining(expiresAt)
  );

  useEffect(() => {
    const update = () => {
      const remaining = expirationService.getTimeRemaining(expiresAt);
      setTime(remaining);
      if (remaining.isExpired && onExpire) {
        onExpire();
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  if (time.isExpired) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 ${className}`}
      >
        <AlertCircle className="w-3.5 h-3.5" />
        <span>Expired</span>
      </div>
    );
  }

  // Warning state if less than 30 mins remaining
  const isUrgent = time.totalSeconds < 1800;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md transition-colors ${
        isUrgent
          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse'
          : 'bg-slate-800/80 text-slate-300 border border-slate-700/60'
      } ${className}`}
      title={`Expires at: ${new Date(expiresAt).toLocaleTimeString()}`}
    >
      {showIcon && <Clock className="w-3.5 h-3.5 text-indigo-400" />}
      <span className="font-mono">{time.formatted} left</span>
    </div>
  );
};

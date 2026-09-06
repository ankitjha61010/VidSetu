import { driveApi } from './driveApi';
import { googleAuth } from './googleAuth';
import { VideoMetadata } from '../types';

export const EXPIRATION_HOURS = 72; // 3 Days (72 hours)

export interface ExpirationTimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isExpired: boolean;
  formatted: string;
}

export class ExpirationService {
  /**
   * Calculate precise time remaining until 3-day expiration
   */
  public getTimeRemaining(expiresAt: number): ExpirationTimeRemaining {
    const now = Date.now();
    const diffMs = expiresAt - now;

    if (diffMs <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSeconds: 0,
        isExpired: true,
        formatted: 'Expired',
      };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatted = days > 0 ? `${days}d ${pad(hours)}h ${pad(minutes)}m` : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

    return {
      days,
      hours,
      minutes,
      seconds,
      totalSeconds,
      isExpired: false,
      formatted,
    };
  }

  /**
   * Run background cleanup for expired files when user is active with Google auth
   */
  public async purgeExpiredVideos(videos?: VideoMetadata[]): Promise<{ purgedCount: number }> {
    if (!googleAuth.isAuthenticated()) {
      return { purgedCount: 0 };
    }

    try {
      const listToCheck = videos || (await driveApi.listVideos()).videos;
      const now = Date.now();
      // Only purge files with explicit temporary expiration that have passed their 3-day window
      const expired = listToCheck.filter((v) => v.expiresAt && v.expiresAt < v.createdAt + 10 * 24 * 60 * 60 * 1000 && now > v.expiresAt);

      let purgedCount = 0;
      for (const vid of expired) {
        try {
          // Permanently delete file from Google Drive after 3 days
          await driveApi.deleteVideo(vid.driveFileId, true);
          purgedCount++;
        } catch (e) {
          console.warn(`Could not purge expired file ${vid.name}:`, e);
        }
      }

      return { purgedCount };
    } catch (err) {
      console.error('Error during expired video garbage collection:', err);
      return { purgedCount: 0 };
    }
  }

  /**
   * Format human readable relative expiration
   */
  public formatRelativeExpiry(expiresAt: number): string {
    const remaining = this.getTimeRemaining(expiresAt);
    if (remaining.isExpired) return 'Expired';
    if (remaining.hours > 0) return `Expires in ${remaining.hours}h ${remaining.minutes}m`;
    if (remaining.minutes > 0) return `Expires in ${remaining.minutes}m ${remaining.seconds}s`;
    return `Expires in ${remaining.seconds}s`;
  }
}

export const expirationService = new ExpirationService();

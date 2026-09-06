import { driveApi } from './driveApi';
import { googleAuth } from './googleAuth';
import { VideoMetadata } from '../types';

export const EXPIRATION_HOURS = 5;

export interface ExpirationTimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isExpired: boolean;
  formatted: string;
}

export class ExpirationService {
  /**
   * Calculate precise time remaining until 5-hour expiration
   */
  public getTimeRemaining(expiresAt: number): ExpirationTimeRemaining {
    const now = Date.now();
    const diffMs = expiresAt - now;

    if (diffMs <= 0) {
      return {
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSeconds: 0,
        isExpired: true,
        formatted: 'Expired',
      };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

    return {
      hours,
      minutes,
      seconds,
      totalSeconds,
      isExpired: false,
      formatted,
    };
  }

  /**
   * Run background cleanup for expired videos when user is active with Google auth
   */
  public async purgeExpiredVideos(videos?: VideoMetadata[]): Promise<{ purgedCount: number }> {
    if (!googleAuth.isAuthenticated()) {
      return { purgedCount: 0 };
    }

    try {
      const listToCheck = videos || (await driveApi.listVideos()).videos;
      const now = Date.now();
      const expired = listToCheck.filter((v) => v.expiresAt && now > v.expiresAt);

      let purgedCount = 0;
      for (const vid of expired) {
        try {
          await driveApi.deleteVideo(vid.driveFileId, false); // move to trash safely
          purgedCount++;
        } catch (e) {
          console.warn(`Could not purge expired video ${vid.name}:`, e);
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

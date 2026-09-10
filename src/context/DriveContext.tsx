import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { driveApi } from '../services/driveApi';
import { expirationService } from '../services/expirationService';
import { VideoMetadata } from '../types';

interface DriveContextType {
  videos: VideoMetadata[];
  isLoading: boolean;
  isPurging: boolean;
  nextPageToken?: string;
  error: string | null;
  fetchVideos: (refresh?: boolean) => Promise<void>;
  loadMoreVideos: () => Promise<void>;
  deleteVideo: (fileId: string) => Promise<void>;
  purgeExpired: () => Promise<number>;
}

const DriveContext = createContext<DriveContextType | undefined>(undefined);

export const DriveProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPurging, setIsPurging] = useState<boolean>(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async (refresh: boolean = true) => {
    if (refresh) setIsLoading(true);
    setError(null);
    try {
      const result = await driveApi.listVideos();
      setVideos(result.videos);
      setNextPageToken(result.nextPageToken);
      // Background purge
      expirationService.purgeExpiredVideos(result.videos).catch(() => {});
    } catch (err: any) {
      console.error('Error listing videos:', err);
      setError(err.message || 'Failed to list videos from Google Drive.');
    } finally {
      if (refresh) setIsLoading(false);
    }
  }, []);

  // Initial library load
  useEffect(() => {
    fetchVideos(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Periodic expiration cleaner every 15 seconds while open
  useEffect(() => {
    const interval = setInterval(() => {
      setVideos((current) => {
        const now = Date.now();
        return current.map((v) => ({
          ...v,
          isExpired: v.expiresAt ? now > v.expiresAt : false,
        }));
      });
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadMoreVideos = async () => {
    if (!nextPageToken || isLoading) return;
    try {
      const result = await driveApi.listVideos(nextPageToken);
      setVideos((prev) => [...prev, ...result.videos]);
      setNextPageToken(result.nextPageToken);
    } catch (err: any) {
      console.error('Failed to load more videos:', err);
      setError(err.message || 'Error loading more videos.');
    }
  };

  const deleteVideo = async (fileId: string) => {
    await driveApi.consumeTemporaryDownload(fileId);
    setVideos((prev) => prev.filter((v) => v.id !== fileId && v.driveFileId !== fileId));
  };

  const purgeExpired = async (): Promise<number> => {
    setIsPurging(true);
    try {
      const { purgedCount } = await expirationService.purgeExpiredVideos(videos);
      if (purgedCount > 0) {
        await fetchVideos(false);
      }
      return purgedCount;
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <DriveContext.Provider
      value={{
        videos,
        isLoading,
        isPurging,
        nextPageToken,
        error,
        fetchVideos,
        loadMoreVideos,
        deleteVideo,
        purgeExpired,
      }}
    >
      {children}
    </DriveContext.Provider>
  );
};

export const useDrive = (): DriveContextType => {
  const context = useContext(DriveContext);
  if (!context) {
    throw new Error('useDrive must be used within a DriveProvider');
  }
  return context;
};

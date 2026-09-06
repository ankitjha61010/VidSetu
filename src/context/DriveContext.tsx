import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { driveApi } from '../services/driveApi';
import { expirationService } from '../services/expirationService';
import { useAuth } from './AuthContext';
import { DriveFolder, VideoMetadata } from '../types';

interface DriveContextType {
  activeFolder: DriveFolder | null;
  uploadFolder: DriveFolder | null;
  videos: VideoMetadata[];
  isLoading: boolean;
  isPurging: boolean;
  nextPageToken?: string;
  error: string | null;
  fetchVideos: (refresh?: boolean) => Promise<void>;
  loadMoreVideos: () => Promise<void>;
  selectFolder: (folder: DriveFolder) => void;
  selectUploadFolder: (folder: DriveFolder) => void;
  deleteVideo: (fileId: string) => Promise<void>;
  purgeExpired: () => Promise<number>;
  setFolderManually: (folderId: string, folderName?: string) => Promise<void>;
}

const DriveContext = createContext<DriveContextType | undefined>(undefined);

export const DriveProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [activeFolder, setActiveFolder] = useState<DriveFolder | null>(driveApi.getSavedFolder());
  const [uploadFolder, setUploadFolder] = useState<DriveFolder | null>(null);
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPurging, setIsPurging] = useState<boolean>(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  // Initialize Folder on Auth
  useEffect(() => {
    if (isAuthenticated) {
      const initFolderAndVideos = async () => {
        setIsLoading(true);
        try {
          // VidSetu_Videos for video library
          const videosFolder = await driveApi.getOrCreateVideosFolder();
          setActiveFolder(videosFolder);

          // VidSetu_Uploads for uploading new files
          const uFolder = await driveApi.getOrCreateUploadFolder();
          setUploadFolder(uFolder);

          const result = await driveApi.listVideos(videosFolder.id);
          setVideos(result.videos);
          setNextPageToken(result.nextPageToken);

          // Auto-purge expired videos in background
          expirationService.purgeExpiredVideos(result.videos).catch(() => {});
        } catch (err: any) {
          console.error('Failed to init drive folders:', err);
          setError(err.message || 'Unable to load Google Drive folder.');
        } finally {
          setIsLoading(false);
        }
      };
      initFolderAndVideos();
    } else {
      setVideos([]);
    }
  }, [isAuthenticated]);

  // Periodic expiration cleaner every 60 seconds while open
  useEffect(() => {
    if (!isAuthenticated) return;
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
  }, [isAuthenticated]);

  const fetchVideos = useCallback(async (refresh: boolean = true) => {
    if (!isAuthenticated) return;
    if (refresh) setIsLoading(true);
    setError(null);
    try {
      const result = await driveApi.listVideos(activeFolder?.id);
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
  }, [isAuthenticated, activeFolder]);

  const loadMoreVideos = async () => {
    if (!isAuthenticated || !nextPageToken || isLoading) return;
    try {
      const result = await driveApi.listVideos(activeFolder?.id, nextPageToken);
      setVideos((prev) => [...prev, ...result.videos]);
      setNextPageToken(result.nextPageToken);
    } catch (err: any) {
      console.error('Failed to load more videos:', err);
      setError(err.message || 'Error loading more videos.');
    }
  };

  const selectFolder = (folder: DriveFolder) => {
    driveApi.saveActiveFolder(folder);
    setActiveFolder(folder);
    fetchVideos(true);
  };

  const selectUploadFolder = (folder: DriveFolder) => {
    setUploadFolder(folder);
    localStorage.setItem('vidsetu_active_upload_folder', JSON.stringify(folder));
  };

  const setFolderManually = async (folderId: string, folderName?: string) => {
    const details = await driveApi.getFolderDetails(folderId);
    const folder: DriveFolder = {
      id: folderId,
      name: folderName || details?.name || 'Custom Folder',
    };
    selectFolder(folder);
  };

  const deleteVideo = async (fileId: string) => {
    await driveApi.deleteVideo(fileId);
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
        activeFolder,
        uploadFolder,
        videos,
        isLoading,
        isPurging,
        nextPageToken,
        error,
        fetchVideos,
        loadMoreVideos,
        selectFolder,
        selectUploadFolder,
        deleteVideo,
        purgeExpired,
        setFolderManually,
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

import { googleAuth } from './googleAuth';
import { DriveFolder, VideoMetadata } from '../types';

const DRIVE_API_V3 = 'https://www.googleapis.com/drive/v3';
const DEFAULT_VIDEOS_FOLDER_NAME = (import.meta as any).env?.VITE_DEFAULT_FOLDER_NAME || 'VidSetu_Videos';
const DEFAULT_UPLOADS_FOLDER_NAME = (import.meta as any).env?.VITE_UPLOADS_FOLDER_NAME || 'VidSetu_Uploads';
const STORAGE_KEY_FOLDER = 'vidsetu_active_folder';
const STORAGE_KEY_UPLOAD_FOLDER = 'vidsetu_active_upload_folder';
const STORAGE_KEY_LOCAL_METAS = 'vidsetu_local_video_metas';

export class DriveApiService {
  /**
   * Helper to perform authenticated Google Drive fetch requests with auto-retry on 401
   */
  private async fetchDrive(endpoint: string, options: RequestInit = {}, retryOn401: boolean = true): Promise<Response> {
    const token = await googleAuth.getValidAccessToken();
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token}`);

    const res = await fetch(`${DRIVE_API_V3}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401 && retryOn401) {
      // Token expired or invalidated, clear and prompt login
      googleAuth.logout();
      const newToken = await googleAuth.getValidAccessToken();
      const retryHeaders = new Headers(options.headers || {});
      retryHeaders.set('Authorization', `Bearer ${newToken}`);
      return this.fetchDrive(endpoint, { ...options, headers: retryHeaders }, false);
    }

    if (!res.ok) {
      let errDetail = '';
      try {
        const errJson = await res.json();
        errDetail = errJson.error?.message || JSON.stringify(errJson);
      } catch {
        errDetail = await res.text();
      }
      throw new Error(`Drive API Error (${res.status}): ${errDetail || res.statusText}`);
    }

    return res;
  }

  /**
   * Helper to get or create a folder by name
   */
  private async getOrCreateFolderByName(folderName: string, storageKey: string): Promise<DriveFolder> {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.id) {
          const folder = await this.getFolderDetails(parsed.id);
          if (folder) return folder;
        }
      } catch (err) {
        console.warn(`Saved folder for ${folderName} unreachable:`, err);
      }
    }

    // Search for existing folder
    const q = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const res = await this.fetchDrive(`/files?q=${encodeURIComponent(q)}&fields=files(id,name)&spaces=drive`);
    const data = await res.json();

    if (data.files && data.files.length > 0) {
      const folder: DriveFolder = { id: data.files[0].id, name: data.files[0].name };
      localStorage.setItem(storageKey, JSON.stringify(folder));
      return folder;
    }

    // Create folder
    const createRes = await this.fetchDrive('/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        description: `VidSetu ${folderName} storage folder`,
      }),
    });

    const newFolder = await createRes.json();
    const folder: DriveFolder = { id: newFolder.id, name: newFolder.name };
    localStorage.setItem(storageKey, JSON.stringify(folder));
    return folder;
  }

  /**
   * Get or create library videos folder (VidSetu_Videos)
   */
  public async getOrCreateVideosFolder(): Promise<DriveFolder> {
    return this.getOrCreateFolderByName(DEFAULT_VIDEOS_FOLDER_NAME, STORAGE_KEY_FOLDER);
  }

  /**
   * Get or create designated uploads folder (VidSetu_Uploads)
   */
  public async getOrCreateUploadFolder(): Promise<DriveFolder> {
    return this.getOrCreateFolderByName(DEFAULT_UPLOADS_FOLDER_NAME, STORAGE_KEY_UPLOAD_FOLDER);
  }

  /**
   * Default folder handler for backward compatibility
   */
  public async getOrCreateDefaultFolder(): Promise<DriveFolder> {
    return this.getOrCreateUploadFolder();
  }

  public async getFolderDetails(folderId: string): Promise<DriveFolder | null> {
    try {
      const res = await this.fetchDrive(`/files/${folderId}?fields=id,name,mimeType,trashed`);
      const data = await res.json();
      if (data.trashed || data.mimeType !== 'application/vnd.google-apps.folder') {
        return null;
      }
      return { id: data.id, name: data.name };
    } catch {
      return null;
    }
  }

  public getSavedFolder(): DriveFolder | null {
    const raw = localStorage.getItem(STORAGE_KEY_FOLDER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public saveActiveFolder(folder: DriveFolder): void {
    localStorage.setItem(STORAGE_KEY_FOLDER, JSON.stringify(folder));
  }

  /**
   * List folders for the settings selector
   */
  public async listUserFolders(): Promise<DriveFolder[]> {
    const q = `mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const res = await this.fetchDrive(`/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=50&orderBy=name`);
    const data = await res.json();
    return data.files || [];
  }

  /**
   * List videos stored in the target folder with support for manual uploads & movies
   */
  public async listVideos(folderId?: string, pageToken?: string): Promise<{ videos: VideoMetadata[]; nextPageToken?: string }> {
    const videosFolder = await this.getOrCreateVideosFolder();
    const targetFolderId = folderId || videosFolder?.id;

    if (!targetFolderId) {
      return { videos: [] };
    }

    // Strictly search ONLY files inside the VidSetu_Videos folder
    let q = `trashed = false and '${targetFolderId}' in parents`;

    let url = `/files?q=${encodeURIComponent(q)}&fields=nextPageToken,files(id,name,size,mimeType,createdTime,thumbnailLink,webContentLink,webViewLink,appProperties,properties,parents)&pageSize=100&orderBy=createdTime desc`;
    if (pageToken) {
      url += `&pageToken=${encodeURIComponent(pageToken)}`;
    }

    let res = await this.fetchDrive(url);
    let data = await res.json();

    const localCache = this.getLocalMetadataCache();

    // Filter to video files (MIME type video/*, video extensions, or generic binary video files)
    const videoFiles = (data.files || []).filter((file: any) => {
      const mime = (file.mimeType || '').toLowerCase();
      const name = (file.name || '').toLowerCase();
      const isVideoMime = mime.startsWith('video/') || mime.includes('video') || mime === 'application/vnd.google-apps.video' || mime === 'application/octet-stream';
      const isVideoExt = name.match(/\.(mp4|mkv|webm|mov|avi|m4v|3gp|wmv|flv|ts|mpg|mpeg)$/i);
      return (isVideoMime || isVideoExt) && mime !== 'application/vnd.google-apps.folder';
    });

    const videos: VideoMetadata[] = videoFiles.map((file: any) => {
      const appProps = file.appProperties || {};
      const fallbackLocal = localCache[file.id] || {};

      const hasExplicitExpiration = !!appProps.vidsetu_expires_at || !!fallbackLocal.expiresAt;
      const createdAt = parseInt(appProps.vidsetu_created_at || fallbackLocal.createdAt || new Date(file.createdTime || Date.now()).getTime(), 10);
      
      // Permanent library movie (10 years lifespan) unless explicitly uploaded via temporary WeTransfer
      const expiresAt = hasExplicitExpiration
        ? parseInt(appProps.vidsetu_expires_at || fallbackLocal.expiresAt, 10)
        : (createdAt + 10 * 365 * 24 * 60 * 60 * 1000);

      const isExpired = hasExplicitExpiration && Date.now() > expiresAt;

      const meta: VideoMetadata = {
        id: file.id,
        driveFileId: file.id,
        name: file.name,
        originalFileName: appProps.original_name || file.name,
        size: parseInt(file.size || '0', 10),
        mimeType: file.mimeType || 'video/mp4',
        createdAt,
        expiresAt,
        isExpired,
        thumbnailLink: file.thumbnailLink,
        webContentLink: file.webContentLink,
        webViewLink: file.webViewLink,
        driveFolderId: targetFolderId,
      };

      // Keep cache updated
      this.cacheVideoMetadata(meta);
      return meta;
    });

    return {
      videos,
      nextPageToken: data.nextPageToken,
    };
  }

  /**
   * Get single video metadata by Drive file ID or check expiration
   */
  public async getVideoMetadata(fileId: string): Promise<VideoMetadata> {
    const res = await this.fetchDrive(`/files/${fileId}?fields=id,name,size,mimeType,createdTime,thumbnailLink,webContentLink,webViewLink,appProperties,parents,trashed`);
    const file = await res.json();

    if (file.trashed) {
      throw new Error('This video file has been removed or deleted from Google Drive.');
    }

    const appProps = file.appProperties || {};
    const localCache = this.getLocalMetadataCache();
    const fallbackLocal = localCache[file.id] || {};

    const createdAt = parseInt(appProps.vidsetu_created_at || fallbackLocal.createdAt || new Date(file.createdTime || Date.now()).getTime(), 10);
    const expiresAt = parseInt(appProps.vidsetu_expires_at || fallbackLocal.expiresAt || (createdAt + 5 * 60 * 60 * 1000), 10);
    const isExpired = Date.now() > expiresAt;

    const meta: VideoMetadata = {
      id: file.id,
      driveFileId: file.id,
      name: file.name,
      originalFileName: appProps.original_name || file.name,
      size: parseInt(file.size || '0', 10),
      mimeType: file.mimeType,
      createdAt,
      expiresAt,
      isExpired,
      thumbnailLink: file.thumbnailLink,
      webContentLink: file.webContentLink,
      webViewLink: file.webViewLink,
      driveFolderId: file.parents?.[0],
    };

    this.cacheVideoMetadata(meta);
    return meta;
  }

  /**
   * Delete a video file from Google Drive permanently or move to trash
   */
  public async deleteVideo(fileId: string, permanent: boolean = true): Promise<void> {
    if (permanent) {
      await this.fetchDrive(`/files/${fileId}`, { method: 'DELETE' });
    } else {
      await this.fetchDrive(`/files/${fileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trashed: true }),
      });
    }

    // Remove from local cache
    this.removeCachedMetadata(fileId);
  }

  /**
   * Fetch a streamable/downloadable direct media blob or range URL
   */
  public async getVideoStreamBlob(fileId: string, onProgress?: (percent: number) => void): Promise<Blob> {
    const token = await googleAuth.getValidAccessToken();
    const res = await fetch(`${DRIVE_API_V3}/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to stream video content from Google Drive (${res.status})`);
    }

    if (!res.body || !onProgress) {
      return await res.blob();
    }

    const contentLength = +(res.headers.get('Content-Length') || 0);
    const reader = res.body.getReader();
    let receivedBytes = 0;
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        receivedBytes += value.length;
        if (contentLength > 0) {
          onProgress(Math.round((receivedBytes / contentLength) * 100));
        }
      }
    }

    const contentType = res.headers.get('Content-Type') || 'video/mp4';
    return new Blob(chunks as any, { type: contentType });
  }

  /**
   * Local metadata caching to handle cross-origin or immediate local updates
   */
  public getLocalMetadataCache(): Record<string, Partial<VideoMetadata>> {
    const raw = localStorage.getItem(STORAGE_KEY_LOCAL_METAS);
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  public cacheVideoMetadata(meta: VideoMetadata): void {
    const cache = this.getLocalMetadataCache();
    cache[meta.driveFileId] = {
      id: meta.id,
      driveFileId: meta.driveFileId,
      name: meta.name,
      originalFileName: meta.originalFileName,
      size: meta.size,
      mimeType: meta.mimeType,
      createdAt: meta.createdAt,
      expiresAt: meta.expiresAt,
      thumbnailLink: meta.thumbnailLink,
    };
    localStorage.setItem(STORAGE_KEY_LOCAL_METAS, JSON.stringify(cache));
  }

  public removeCachedMetadata(fileId: string): void {
    const cache = this.getLocalMetadataCache();
    delete cache[fileId];
    localStorage.setItem(STORAGE_KEY_LOCAL_METAS, JSON.stringify(cache));
  }
}

export const driveApi = new DriveApiService();

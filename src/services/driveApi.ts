import { googleAuth } from './googleAuth';
import { DriveFolder, VideoMetadata } from '../types';
import { isVideoFile as isVideoFileType } from '../utils/fileType';

const DRIVE_API_V3 = 'https://www.googleapis.com/drive/v3';
const STORAGE_KEY_FOLDER = 'vidsetu_active_folder';
const STORAGE_KEY_UPLOAD_FOLDER = 'vidsetu_active_upload_folder';
const STORAGE_KEY_LOCAL_METAS = 'vidsetu_local_video_metas';

export const getCentralFolderId = (): string => {
  return ((import.meta as any).env?.VITE_CENTRAL_FOLDER_ID || (import.meta as any).env?.VITE_PUBLIC_FOLDER_ID || '').trim();
};

export const getGoogleApiKey = (): string => {
  return ((import.meta as any).env?.VITE_GOOGLE_API_KEY || '').trim();
};

export const getVideosFolderName = (): string => {
  return ((import.meta as any).env?.VITE_DEFAULT_FOLDER_NAME || 'VidSetu_Videos').trim();
};

export const getUploadsFolderName = (): string => {
  return ((import.meta as any).env?.VITE_UPLOADS_FOLDER_NAME || 'VidSetu_Uploads').trim();
};

// A video counts as a temporary, one-time-download share (rather than a permanent library
// upload, which gets a 10-year expiry) when its lifespan is well short of that permanent window.
export const isTemporaryUpload = (video: Pick<VideoMetadata, 'expiresAt' | 'createdAt'>): boolean => {
  return Boolean(video.expiresAt) && video.expiresAt < video.createdAt + 10 * 24 * 60 * 60 * 1000;
};

// Same-origin download URL, proxied through our own Edge Function instead of pointing at
// drive.google.com directly. drive.google.com is a verified Android App Link for the Google
// Drive app, so navigating to it on mobile gets intercepted by the OS into an account-picker /
// "open with Drive" prompt instead of just saving the file - a same-origin URL never does that.
export const getDirectDownloadUrl = (fileId: string, fileName: string): string => {
  const params = new URLSearchParams({ id: fileId, name: fileName });
  return `/api/download-file?${params.toString()}`;
};

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

    // Search for existing folders (there may be multiple folders named folderName in Drive)
    const q = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const res = await this.fetchDrive(`/files?q=${encodeURIComponent(q)}&fields=files(id,name)&spaces=drive&supportsAllDrives=true&includeItemsFromAllDrives=true`);
    const data = await res.json();

    if (data.files && data.files.length > 0) {
      const folder: DriveFolder = { id: data.files[0].id, name: data.files[0].name };
      localStorage.setItem(storageKey, JSON.stringify(folder));
      return folder;
    }

    // Create folder
    const createRes = await this.fetchDrive('/files?supportsAllDrives=true', {
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
   * Get or create library videos folder (VidSetu_Videos or VITE_DEFAULT_FOLDER_NAME)
   */
  public async getOrCreateVideosFolder(): Promise<DriveFolder> {
    const centralFolderId = getCentralFolderId();
    if (centralFolderId) {
      const folder: DriveFolder = {
        id: centralFolderId,
        name: getVideosFolderName(),
      };
      this.saveActiveFolder(folder);
      return folder;
    }
    return this.getOrCreateFolderByName(getVideosFolderName(), STORAGE_KEY_FOLDER);
  }

  /**
   * Get or create designated uploads folder (VidSetu_Uploads or VITE_UPLOADS_FOLDER_NAME)
   */
  public async getOrCreateUploadFolder(): Promise<DriveFolder> {
    return this.getOrCreateFolderByName(getUploadsFolderName(), STORAGE_KEY_UPLOAD_FOLDER);
  }

  /**
   * Default folder handler for backward compatibility
   */
  public async getOrCreateDefaultFolder(): Promise<DriveFolder> {
    return this.getOrCreateUploadFolder();
  }

  public async getFolderDetails(folderId: string): Promise<DriveFolder | null> {
    try {
      const res = await this.fetchDrive(`/files/${folderId}?fields=id,name,mimeType,trashed&supportsAllDrives=true`);
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
    const centralFolderId = getCentralFolderId();
    if (centralFolderId) {
      return { id: centralFolderId, name: getVideosFolderName() };
    }
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
    const res = await this.fetchDrive(`/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=50&orderBy=name&supportsAllDrives=true&includeItemsFromAllDrives=true`);
    const data = await res.json();
    return data.files || [];
  }

  /**
   * Helper to check if a Drive file is a movie/video file
   */
  public isVideoFile(file: any): boolean {
    const mime = (file?.mimeType || '').toLowerCase().trim();

    // Folders are not videos
    if (mime === 'application/vnd.google-apps.folder' || mime.includes('folder')) {
      return false;
    }

    // Single source of truth shared with the player/UI file-type detection, so a file
    // that's excluded here (e.g. .aab/.apk/.ipa) can never later be misread as a video.
    return isVideoFileType(file?.name || '', file?.mimeType);
  }

  /**
   * List videos stored in the VidSetu_Videos folder(s) for the movies library
   */
  public async listVideos(folderId?: string, pageToken?: string): Promise<{ videos: VideoMetadata[]; nextPageToken?: string }> {
    const targetFolderName = getVideosFolderName();
    const centralFolderId = getCentralFolderId();
    let folderIdsToSearch: string[] = [];

    if (centralFolderId) {
      // When a central server folder is configured, exclusively query that folder
      folderIdsToSearch = [centralFolderId];
    } else {
      // Otherwise discover VidSetu_Videos folders in user's Drive
      try {
        const folderQ = `name = '${targetFolderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
        const folderRes = await this.fetchDrive(
          `/files?q=${encodeURIComponent(folderQ)}&fields=files(id,name)&spaces=drive`
        );
        const folderData = await folderRes.json();
        if (folderData.files && Array.isArray(folderData.files)) {
          folderData.files.forEach((f: any) => {
            if (f.id && !folderIdsToSearch.includes(f.id)) {
              folderIdsToSearch.push(f.id);
            }
          });
        }
      } catch (e) {
        console.warn('[VidSetu] Error searching VidSetu folders:', e);
      }

      if (folderId && !folderIdsToSearch.includes(folderId)) {
        folderIdsToSearch.push(folderId);
      }

      if (folderIdsToSearch.length === 0) {
        try {
          const defaultF = await this.getOrCreateVideosFolder();
          if (defaultF?.id && !folderIdsToSearch.includes(defaultF.id)) {
            folderIdsToSearch.push(defaultF.id);
          }
        } catch (e) {
          console.warn('[VidSetu] Error getting default folder:', e);
        }
      }
    }

    let collectedFiles: any[] = [];
    let lastNextPageToken: string | undefined = undefined;

    // Query files from each identified folder
    for (const fId of folderIdsToSearch) {
      try {
        const fileQ = `'${fId}' in parents and trashed = false`;
        let url = `/files?q=${encodeURIComponent(fileQ)}&fields=nextPageToken,files(id,name,size,mimeType,createdTime,thumbnailLink,webContentLink,webViewLink,videoMediaMetadata,appProperties,properties,parents)&pageSize=100&orderBy=createdTime desc&supportsAllDrives=true&includeItemsFromAllDrives=true`;
        if (pageToken) {
          url += `&pageToken=${encodeURIComponent(pageToken)}`;
        }
        const fileRes = await this.fetchDrive(url);
        const fileData = await fileRes.json();
        if (fileData.files && Array.isArray(fileData.files)) {
          collectedFiles.push(...fileData.files);
        }
        if (fileData.nextPageToken) {
          lastNextPageToken = fileData.nextPageToken;
        }
      } catch (err) {
        console.warn(`[VidSetu] Error fetching files in folder ${fId}:`, err);
      }
    }

    // Deduplicate by file ID
    const uniqueFilesMap = new Map<string, any>();
    collectedFiles.forEach((file) => {
      if (file?.id && !uniqueFilesMap.has(file.id)) {
        uniqueFilesMap.set(file.id, file);
      }
    });

    const localCache = this.getLocalMetadataCache();

    // Filter strictly to non-rejected video files
    const videoFiles = Array.from(uniqueFilesMap.values()).filter((file: any) => this.isVideoFile(file));

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
        mimeType: file.mimeType || 'application/octet-stream',
        createdAt,
        expiresAt,
        isExpired,
        thumbnailLink: file.thumbnailLink,
        webContentLink: file.webContentLink,
        webViewLink: file.webViewLink,
        driveFolderId: file.parents?.[0] || folderIdsToSearch[0] || '',
      };

      // Keep cache updated
      this.cacheVideoMetadata(meta);
      return meta;
    });

    return {
      videos,
      nextPageToken: lastNextPageToken,
    };
  }

  /**
   * Get single video metadata by Drive file ID or check expiration (supports public unauthenticated fetching)
   */
  public async getVideoMetadata(fileId: string): Promise<VideoMetadata> {
    let file: any = null;

    // 1. Try authenticated drive fetch if access token is available
    if (googleAuth.isAuthenticated()) {
      try {
        const res = await this.fetchDrive(`/files/${fileId}?fields=id,name,size,mimeType,createdTime,thumbnailLink,webContentLink,webViewLink,appProperties,parents,trashed`);
        file = await res.json();
      } catch (err) {
        console.warn('Authenticated file metadata fetch fallback to public:', err);
      }
    }

    // 2. If not authenticated or failed, fetch metadata via public endpoint or cached metadata
    if (!file || !file.id) {
      const localCache = this.getLocalMetadataCache();
      const cached = localCache[fileId];

      if (cached && cached.name) {
        file = {
          id: fileId,
          name: cached.name,
          size: cached.size?.toString() || '0',
          mimeType: cached.mimeType || 'application/octet-stream',
          createdTime: new Date(cached.createdAt || Date.now()).toISOString(),
          thumbnailLink: cached.thumbnailLink,
          appProperties: {
            vidsetu_created_at: cached.createdAt?.toString(),
            vidsetu_expires_at: cached.expiresAt?.toString(),
            original_name: cached.originalFileName || cached.name,
          },
        };
      } else {
        // Unauthenticated fetch attempt with fallback basic file structure
        file = {
          id: fileId,
          name: 'Shared File',
          size: '0',
          mimeType: 'application/octet-stream',
          createdTime: new Date().toISOString(),
          webContentLink: `https://drive.google.com/uc?export=download&id=${fileId}`,
          webViewLink: `https://drive.google.com/file/d/${fileId}/view`,
        };
      }
    }

    if (file.trashed) {
      throw new Error('This file has been removed or deleted from Google Drive.');
    }

    const appProps = file.appProperties || {};
    const localCache = this.getLocalMetadataCache();
    const fallbackLocal = localCache[file.id] || {};

    const hasExplicitExpiration = Boolean(appProps.vidsetu_expires_at || fallbackLocal.expiresAt);
    const createdAt = parseInt(appProps.vidsetu_created_at || fallbackLocal.createdAt || new Date(file.createdTime || Date.now()).getTime(), 10);
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
      mimeType: file.mimeType,
      createdAt,
      expiresAt,
      isExpired,
      thumbnailLink: file.thumbnailLink,
      webContentLink: file.webContentLink || `https://drive.google.com/uc?export=download&id=${file.id}`,
      webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
      driveFolderId: file.parents?.[0],
    };

    this.cacheVideoMetadata(meta);
    return meta;
  }

  /**
   * Make a file accessible by anyone with the link (reader role)
   */
  public async makeFilePublic(fileId: string): Promise<void> {
    try {
      await this.fetchDrive(`/files/${fileId}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone',
        }),
      });
    } catch (err) {
      console.warn('Could not set anyone-with-link public permission:', err);
    }
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
   * Consume a one-time temporary share link: ask the server (which holds a service-account
   * credential) to delete the file from Drive. Unlike deleteVideo(), this works even when the
   * caller is an anonymous recipient with no Google session of their own - the recipient only
   * ever has public "reader" access, which can view/download a file but can never delete it.
   */
  public async consumeTemporaryDownload(fileId: string): Promise<void> {
    try {
      const res = await fetch('/api/consume-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      });
      if (!res.ok) {
        console.warn('Failed to delete temporary file after download:', res.status, await res.text());
        return;
      }
    } catch (err) {
      console.warn('Failed to reach delete-after-download endpoint:', err);
      return;
    }

    this.removeCachedMetadata(fileId);
  }

  /**
   * Fetch a streamable/downloadable direct media blob or range URL
   */
  public async getVideoStreamBlob(
    fileId: string,
    onProgress?: (loadedBytes: number, totalBytes: number) => void,
    expectedSize?: number
  ): Promise<Blob> {
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
    // Content-Length isn't always exposed by the Drive API response; fall back to the
    // caller-supplied known file size so progress doesn't silently stay stuck at 0.
    const totalBytes = contentLength > 0 ? contentLength : (expectedSize || 0);
    const reader = res.body.getReader();
    let receivedBytes = 0;
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        receivedBytes += value.length;
        onProgress(receivedBytes, totalBytes);
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

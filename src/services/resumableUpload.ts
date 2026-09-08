import { googleAuth } from './googleAuth';
import { driveApi } from './driveApi';
import { UploadProgressInfo, VideoMetadata, UploadStatus } from '../types';
import { TransferSpeedTracker } from '../utils/transferSpeed';

export const MAX_FILE_SIZE_BYTES = 12 * 1024 * 1024 * 1024; // 12 GB exactly
export const CHUNK_SIZE = 8 * 1024 * 1024; // 8 MB chunk size for high performance large file upload
export const EXPIRATION_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 Days (72 hours) in milliseconds

export interface ResumableUploadOptions {
  file: File;
  folderId?: string;
  onProgress?: (progress: UploadProgressInfo) => void;
}

export class ResumableUploader {
  private file: File;
  private folderId?: string;
  private onProgress?: (progress: UploadProgressInfo) => void;
  private uploadUrl: string | null = null;
  private isPaused: boolean = false;
  private isCancelled: boolean = false;
  private currentByte: number = 0;
  private speedTracker: TransferSpeedTracker = new TransferSpeedTracker();
  private currentXHR: XMLHttpRequest | null = null;

  constructor(options: ResumableUploadOptions) {
    this.file = options.file;
    this.folderId = options.folderId;
    this.onProgress = options.onProgress;
  }

  public validateFile(): { valid: boolean; error?: string } {
    if (!this.file) {
      return { valid: false, error: 'No file selected.' };
    }

    if (this.file.size > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: `Maximum file size is 12 GB. Your file is ${(this.file.size / (1024 * 1024 * 1024)).toFixed(2)} GB.`,
      };
    }

    // Allow ANY file type (APK, ZIP, video, documents, etc.)
    return { valid: true };
  }

  public async start(): Promise<VideoMetadata> {
    const validation = this.validateFile();
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    this.isCancelled = false;
    this.isPaused = false;
    this.notifyProgress('preparing', 0, 0, 0, 0);

    // Step 1: Initialize Resumable Session with Drive
    const token = await googleAuth.getValidAccessToken();
    const folder = this.folderId || (await driveApi.getOrCreateDefaultFolder()).id;

    const createdAt = Date.now();
    const expiresAt = createdAt + EXPIRATION_DURATION_MS;

    const metadata = {
      name: this.file.name,
      mimeType: this.file.type || 'application/octet-stream',
      parents: folder ? [folder] : [],
      description: `Uploaded via VidSetu. Expires at ${new Date(expiresAt).toISOString()}`,
      // Stored under `properties` (visible to all apps) rather than `appProperties` (private to
      // the requesting app) because Drive refuses to return appProperties on an unauthenticated,
      // API-key-only request - which is exactly how anonymous link recipients fetch metadata. If
      // this lived only in appProperties, isTemporaryUpload() would read it as absent for them
      // and skip deleting the file after their download.
      properties: {
        vidsetu_created_at: createdAt.toString(),
        vidsetu_expires_at: expiresAt.toString(),
        original_name: this.file.name,
      },
    };

    const sessionRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,size,mimeType,createdTime,thumbnailLink,webContentLink,webViewLink,properties,appProperties',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': this.file.type || 'application/octet-stream',
          'X-Upload-Content-Length': this.file.size.toString(),
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!sessionRes.ok) {
      const err = await sessionRes.text();
      throw new Error(`Failed to initiate Google Drive upload session: ${err}`);
    }

    this.uploadUrl = sessionRes.headers.get('Location');
    if (!this.uploadUrl) {
      throw new Error('Google Drive did not return a valid resumable upload location header.');
    }

    this.currentByte = 0;
    this.speedTracker.reset(0);

    return await this.uploadNextChunks();
  }

  private async uploadNextChunks(): Promise<VideoMetadata> {
    while (this.currentByte < this.file.size) {
      if (this.isCancelled) {
        this.notifyProgress('cancelled', 0, this.currentByte, 0, 0);
        throw new Error('Upload was cancelled.');
      }

      if (this.isPaused) {
        this.notifyProgress('paused', this.calculatePercent(), this.currentByte, 0, 0);
        // Wait until resumed
        return new Promise((resolve, reject) => {
          const checkInterval = setInterval(() => {
            if (this.isCancelled) {
              clearInterval(checkInterval);
              reject(new Error('Upload was cancelled.'));
            } else if (!this.isPaused) {
              clearInterval(checkInterval);
              this.uploadNextChunks().then(resolve).catch(reject);
            }
          }, 300);
        });
      }

      const chunkStart = this.currentByte;
      const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, this.file.size);
      // Slicing blob without loading entire file to heap memory
      const chunk = this.file.slice(chunkStart, chunkEnd);

      let chunkUploaded = false;
      let retries = 0;
      const maxRetries = 5;

      while (!chunkUploaded && retries < maxRetries) {
        if (this.isCancelled || this.isPaused) break;
        try {
          const result = await this.sendChunkWithXHR(chunk, chunkStart, chunkEnd);

          if (result.status === 308) {
            // Resume Incomplete - proceed to next chunk
            this.currentByte = chunkEnd;
            this.updateMetrics(this.currentByte);
            chunkUploaded = true;
          } else if (result.status === 200 || result.status === 201) {
            // Completed!
            const fileData = JSON.parse(result.response);
            this.currentByte = this.file.size;
            this.notifyProgress('completed', 100, this.file.size, 0, 0, undefined, fileData.id);

            // Set public sharing link permission so recipient can watch/download without signing in
            await driveApi.makeFilePublic(fileData.id);

            const videoMeta: VideoMetadata = {
              id: fileData.id,
              driveFileId: fileData.id,
              name: fileData.name,
              originalFileName: this.file.name,
              size: this.file.size,
              mimeType: fileData.mimeType,
              createdAt: parseInt(fileData.properties?.vidsetu_created_at || fileData.appProperties?.vidsetu_created_at || Date.now().toString(), 10),
              expiresAt: parseInt(fileData.properties?.vidsetu_expires_at || fileData.appProperties?.vidsetu_expires_at || (Date.now() + EXPIRATION_DURATION_MS).toString(), 10),
              isExpired: false,
              thumbnailLink: fileData.thumbnailLink,
              webContentLink: fileData.webContentLink,
              webViewLink: fileData.webViewLink,
              driveFolderId: this.folderId,
            };

            driveApi.cacheVideoMetadata(videoMeta);
            return videoMeta;
          } else {
            throw new Error(`Unexpected server response during chunk upload: HTTP ${result.status}`);
          }
        } catch (err: any) {
          retries++;
          if (retries >= maxRetries) {
            this.notifyProgress('failed', this.calculatePercent(), this.currentByte, 0, 0, err.message);
            throw err;
          }
          // Exponential backoff
          await new Promise((r) => setTimeout(r, Math.min(1000 * Math.pow(2, retries), 8000)));
          // Query Drive for last confirmed received offset
          await this.queryUploadedStatus();
        }
      }
    }

    throw new Error('Upload loop completed without receiving final Google Drive file record.');
  }

  private sendChunkWithXHR(
    chunk: Blob,
    start: number,
    end: number
  ): Promise<{ status: number; response: string }> {
    return new Promise((resolve, reject) => {
      if (!this.uploadUrl) return reject(new Error('Missing resumable upload URL'));

      const xhr = new XMLHttpRequest();
      this.currentXHR = xhr;

      xhr.open('PUT', this.uploadUrl, true);
      xhr.setRequestHeader('Content-Range', `bytes ${start}-${end - 1}/${this.file.size}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const currentLoaded = start + e.loaded;
          this.updateMetrics(currentLoaded);
        }
      };

      xhr.onload = () => {
        this.currentXHR = null;
        resolve({ status: xhr.status, response: xhr.responseText });
      };

      xhr.onerror = () => {
        this.currentXHR = null;
        reject(new Error('Network connectivity issue while transmitting chunk. Retrying...'));
      };

      xhr.onabort = () => {
        this.currentXHR = null;
        reject(new Error('Chunk request aborted.'));
      };

      xhr.send(chunk);
    });
  }

  private async queryUploadedStatus(): Promise<number> {
    if (!this.uploadUrl) return 0;
    try {
      const res = await fetch(this.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Range': `bytes */${this.file.size}`,
        },
      });

      if (res.status === 308) {
        const range = res.headers.get('Range');
        if (range) {
          const match = range.match(/bytes=0-(\d+)/);
          if (match && match[1]) {
            this.currentByte = parseInt(match[1], 10) + 1;
            return this.currentByte;
          }
        }
      }
    } catch {
      // Ignored, proceed with existing byte offset
    }
    return this.currentByte;
  }

  private updateMetrics(currentLoaded: number) {
    const { percent, speed, etaSeconds } = this.speedTracker.update(currentLoaded, this.file.size);
    this.notifyProgress('uploading', percent, currentLoaded, speed, etaSeconds);
  }

  private calculatePercent(): number {
    return Math.min(100, Math.round((this.currentByte / this.file.size) * 100));
  }

  private notifyProgress(
    status: UploadStatus,
    progress: number,
    uploadedBytes: number,
    speed: number,
    estimatedSecondsLeft: number,
    error?: string,
    uploadedFileId?: string
  ) {
    if (this.onProgress) {
      this.onProgress({
        status,
        progress,
        uploadedBytes,
        totalBytes: this.file.size,
        speed,
        estimatedSecondsLeft,
        error,
        uploadedFileId,
      });
    }
  }

  public pause(): void {
    this.isPaused = true;
    if (this.currentXHR) {
      this.currentXHR.abort();
      this.currentXHR = null;
    }
    this.notifyProgress('paused', this.calculatePercent(), this.currentByte, 0, 0);
  }

  public resume(): void {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.speedTracker.reset(this.currentByte);
    this.notifyProgress('uploading', this.calculatePercent(), this.currentByte, 0, 0);
  }

  public cancel(): void {
    this.isCancelled = true;
    this.isPaused = false;
    if (this.currentXHR) {
      this.currentXHR.abort();
      this.currentXHR = null;
    }
    if (this.uploadUrl) {
      fetch(this.uploadUrl, { method: 'DELETE' }).catch(() => {});
    }
    this.notifyProgress('cancelled', 0, 0, 0, 0);
  }
}

// Lists files in the site owner's library folder using the owner's own refresh token, so the
// Library page can be browsed by anyone with no Google sign-in of their own - matching upload
// (init-upload.ts) and download, which already work the same way. Read-only: this never grants
// write access to a caller, so it's safe to expose without any authentication.
import type { Config } from '@netlify/functions';
import { getDriveAccessToken } from '../lib/googleDriveAuth';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';

function getLibraryFolderName(): string {
  return (process.env.VITE_DEFAULT_FOLDER_NAME || 'VidSetu_Videos').trim();
}

async function resolveLibraryFolderId(token: string): Promise<string | null> {
  const fixedId = (process.env.VITE_CENTRAL_FOLDER_ID || process.env.VITE_PUBLIC_FOLDER_ID || '').trim();
  if (fixedId) return fixedId;

  const folderName = getLibraryFolderName();
  const q = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const searchRes = await fetch(
    `${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id,name)&spaces=drive&supportsAllDrives=true&includeItemsFromAllDrives=true`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!searchRes.ok) return null;
  const data = await searchRes.json();
  return data.files?.[0]?.id || null;
}

export default async (req: Request) => {
  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let token: string;
  try {
    token = await getDriveAccessToken();
  } catch (err) {
    console.error('Failed to mint Drive access token:', err);
    return new Response('Server not configured', { status: 500 });
  }

  let folderId: string | null;
  try {
    folderId = await resolveLibraryFolderId(token);
  } catch (err) {
    console.error('Failed to resolve library folder:', err);
    return new Response('Failed to look up library folder', { status: 502 });
  }

  if (!folderId) {
    return Response.json({ files: [] });
  }

  const url = new URL(req.url);
  const pageToken = url.searchParams.get('pageToken');

  const fileQ = `'${folderId}' in parents and trashed = false`;
  let listUrl = `${DRIVE_API}/files?q=${encodeURIComponent(fileQ)}&fields=nextPageToken,files(id,name,size,mimeType,createdTime,thumbnailLink,webContentLink,webViewLink,properties,parents)&pageSize=100&orderBy=createdTime desc&supportsAllDrives=true&includeItemsFromAllDrives=true`;
  if (pageToken) {
    listUrl += `&pageToken=${encodeURIComponent(pageToken)}`;
  }

  const listRes = await fetch(listUrl, { headers: { Authorization: `Bearer ${token}` } });
  if (!listRes.ok) {
    const detail = await listRes.text().catch(() => '');
    console.error('Drive file listing failed:', listRes.status, detail);
    return new Response('Failed to list library files', { status: 502 });
  }

  const data = await listRes.json();
  return Response.json({ files: data.files || [], nextPageToken: data.nextPageToken });
};

export const config: Config = {
  path: '/api/list-videos',
};

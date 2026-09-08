// Runs server-side with a Google service-account credential so a link recipient (who never
// signs into the uploader's Google account, and only ever holds public "reader" access) can
// still trigger deletion of a one-time temporary upload after they download it.
import { GoogleAuth } from 'google-auth-library';
import type { Config } from '@netlify/functions';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let fileId: unknown;
  try {
    const body = await req.json();
    fileId = body?.fileId;
  } catch {
    return new Response('Invalid JSON body', { status: 400 });
  }

  if (!fileId || typeof fileId !== 'string') {
    return new Response('Missing fileId', { status: 400 });
  }

  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    console.error('GOOGLE_SERVICE_ACCOUNT_KEY is not configured');
    return new Response('Server not configured', { status: 500 });
  }

  let credentials: { client_email: string; private_key: string };
  try {
    credentials = JSON.parse(serviceAccountKey);
  } catch {
    console.error('GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON');
    return new Response('Server misconfigured', { status: 500 });
  }

  let token: string | null | undefined;
  try {
    const auth = new GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/drive'] });
    const client = await auth.getClient();
    token = (await client.getAccessToken()).token;
  } catch (err) {
    console.error('Failed to mint service-account access token:', err);
    return new Response('Failed to authenticate with Google Drive', { status: 502 });
  }

  if (!token) {
    return new Response('Failed to authenticate with Google Drive', { status: 502 });
  }

  const metaRes = await fetch(
    `${DRIVE_API}/files/${encodeURIComponent(fileId)}?fields=id,trashed,appProperties&supportsAllDrives=true`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (metaRes.status === 404) {
    // Already gone - treat as success so a retry or a race with another delete doesn't error out.
    return Response.json({ success: true, alreadyDeleted: true });
  }
  if (!metaRes.ok) {
    console.error('Drive metadata lookup failed:', metaRes.status, await metaRes.text());
    return new Response('Failed to look up file', { status: 502 });
  }

  const meta = await metaRes.json();
  if (meta.trashed) {
    return Response.json({ success: true, alreadyDeleted: true });
  }

  // Only files explicitly marked as temporary one-time-download uploads (vidsetu_expires_at
  // set by ResumableUploader) can ever be deleted through this public endpoint - this is what
  // stops it being used to wipe permanent VidSetu_Videos library files.
  if (!meta.appProperties?.vidsetu_expires_at) {
    return new Response('This file is not a temporary shared upload and cannot be auto-deleted', { status: 403 });
  }

  const delRes = await fetch(`${DRIVE_API}/files/${encodeURIComponent(fileId)}?supportsAllDrives=true`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!delRes.ok && delRes.status !== 404) {
    console.error('Drive delete failed:', delRes.status, await delRes.text());
    return new Response('Failed to delete file from Drive', { status: 502 });
  }

  return Response.json({ success: true });
};

export const config: Config = {
  path: '/api/consume-download',
};

// Streams a Drive file's bytes through our own domain instead of redirecting the browser to
// drive.google.com. That redirect is what was breaking mobile downloads: drive.google.com is a
// verified Android App Link for the Google Drive app, so a plain navigation to it gets
// intercepted by the OS, which shows an account-picker / "open with Drive" prompt instead of
// just saving the file. Requests to our own origin never trigger that interception.
//
// Runs as a Netlify Edge Function (Deno runtime) rather than a regular Function because a
// standard Lambda-based function both has a response size cap and buffers the whole body in
// memory - neither works for multi-GB video files. Edge Functions can stream the response body
// straight through as it arrives from Drive.
import type { Config, Context } from '@netlify/edge-functions';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

function base64url(input: ArrayBuffer | string): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getServiceAccountToken(credentials: { client_email: string; private_key: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${base64url(
    JSON.stringify({
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    })
  )}`;

  const pemBody = credentials.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s+/g, '');
  const derBytes = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'pkcs8',
    derBytes,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${base64url(signature)}`;

  const tokenRes = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    throw new Error(`Token exchange failed: ${tokenRes.status} ${await tokenRes.text()}`);
  }

  const data = await tokenRes.json();
  return data.access_token;
}

export default async (request: Request, _context: Context) => {
  const url = new URL(request.url);
  const fileId = url.searchParams.get('id');
  const requestedName = url.searchParams.get('name') || 'download';

  if (!fileId) {
    return new Response('Missing id', { status: 400 });
  }

  const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
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

  let token: string;
  try {
    token = await getServiceAccountToken(credentials);
  } catch (err) {
    console.error('Failed to mint service-account access token:', err);
    return new Response('Failed to authenticate with Google Drive', { status: 502 });
  }

  const driveRes = await fetch(
    `${DRIVE_API}/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!driveRes.ok || !driveRes.body) {
    const detail = await driveRes.text().catch(() => '');
    console.error('Drive media fetch failed:', driveRes.status, detail);
    return new Response('Failed to fetch file from Drive', { status: driveRes.status === 404 ? 404 : 502 });
  }

  const asciiName = requestedName.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, "'");
  const headers = new Headers();
  headers.set('Content-Type', driveRes.headers.get('Content-Type') || 'application/octet-stream');
  const length = driveRes.headers.get('Content-Length');
  if (length) headers.set('Content-Length', length);
  headers.set('Content-Disposition', `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(requestedName)}`);
  headers.set('Cache-Control', 'no-store');

  return new Response(driveRes.body, { status: 200, headers });
};

export const config: Config = {
  path: '/api/download-file',
};

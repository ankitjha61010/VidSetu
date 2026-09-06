# VidSetu (विद्सेतु) 🎥

> **Production-Quality Frontend-Only Video Sharing & Watching Web Application**
> Powered directly by **Google Drive API v3** & **Google Identity Services OAuth 2.0**, optimized for static hosting on **Netlify**.

---

## 🌟 Key Features

1. **Pure Frontend Architecture (Zero Backend / Zero Server)**
   - No custom backend, Node.js, Express, or database required.
   - Built with React 18, TypeScript, Tailwind CSS, and Vite.
   - Deployable directly as a static site to Netlify with full SPA redirect compatibility.

2. **Google Drive Cloud Storage Engine**
   - Direct integration with Google Drive API v3 via scoped Google OAuth (`https://www.googleapis.com/auth/drive.file`).
   - Create, list, play, download, and delete videos stored in a designated Google Drive folder (`VidSetu_Videos` or any custom folder selected in Settings).
   - Zero exposure of Google client secrets in frontend source code.

3. **3 GB Resumable Chunked Upload Engine**
   - Strictly enforces a **3 GB maximum video size** limit.
   - Uploads in 4 MB chunks using `Blob.slice()` to prevent browser memory overload.
   - Real-time percentage, uploaded bytes vs. total bytes, speed calculator (MB/s), estimated time remaining (ETA), pause/resume, and cancel controls.
   - Automatic exponential backoff retry on network disruptions.
   - Supports MP4, WebM, MOV, MKV, AVI video formats.

4. **Ephemeral 5-Hour Video Expiration Model**
   - Embeds creation and expiration timestamps directly in Google Drive file `appProperties`.
   - Real-time countdown clock in Library and Watch players.
   - Expired video lockouts: disables playback, downloading, link copying, and QR codes.
   - Automatic garbage collection / purging whenever an authenticated user opens the app or library.

5. **Pro HTML5 Video Player**
   - Responsive, dark glassmorphic design.
   - Custom playback controls (Play/Pause, volume slider, mute, 10s skip, progress scrub bar, fullscreen, Picture-in-Picture).
   - **Centering Zoom Engine**: 1x, 1.25x, 1.5x, 2x, 2.5x with viewport overflow prevention.
   - Full touch and keyboard navigation hotkeys (`Space`, `k`, `f`, `m`, `Arrow Left/Right`, `Arrow Up/Down`).
   - Cross-platform audio support (Desktop Chrome, Safari, Android, iPhone/iPad).

6. **Instant QR Code & Link Sharing**
   - Generates dynamic QR codes for `https://<YOUR_NETLIFY_DOMAIN>/watch/:videoId`.
   - Zero tokens or sensitive credentials embedded in generated QR codes or URLs.
   - One-click copy link with fallback and direct PNG QR download.

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Install Dependencies
```bash
git clone <your-repo-url> vidsetu
cd vidsetu
npm install
```

### 2. Configure Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** with Application Type: **Web application**.
3. Under **Authorized JavaScript Origins**, add:
   - `http://localhost:3000`
   - `https://your-site-name.netlify.app` (when deploying to Netlify)
4. Enable the **Google Drive API** in your Google Cloud Project.
5. Create a `.env` file in the root directory (or use the Settings page in the UI):
```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
VITE_DEFAULT_FOLDER_NAME=VidSetu_Videos
```

### 3. Start Local Dev Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🌐 Deploy to Netlify

### Option A: Deploy via Netlify CLI
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod --dir=dist
```

### Option B: Deploy via GitHub / Netlify Web UI
1. Push this repository to GitHub.
2. Log in to [Netlify](https://app.netlify.com) and click **Add new site > Import an existing project**.
3. Configure Build Settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Set Environment Variables in Netlify (**Site configuration > Environment variables**):
   - `VITE_GOOGLE_CLIENT_ID` = `your_google_oauth_client_id`
5. Ensure `netlify.toml` and `public/_redirects` are present (included out of the box) for single-page routing support (`/watch/:videoId` direct links).

---

## 🔒 Security Architecture
- **No Private Credentials**: VidSetu utilizes the Google Identity Services OAuth 2.0 token model for Single Page Apps. Only the public Client ID is used.
- **Strict Drive Scope**: Requests only `drive.file` scope, giving access only to files uploaded or opened by VidSetu.
- **Clean Watch URLs**: Route identifiers (`/watch/:videoId`) carry only the Drive file ID.
- **Static Hosting**: Configured with strict security headers in `netlify.toml`.

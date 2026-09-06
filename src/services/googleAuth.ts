import { GoogleUser } from '../types';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: GoogleTokenResponse) => void;
            error_callback?: (err: unknown) => void;
          }) => GoogleTokenClient;
        };
      };
    };
  }
}

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  error?: string;
  error_description?: string;
}

export interface GoogleTokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
}

const STORAGE_KEY_TOKEN = 'vidsetu_oauth_token';
const STORAGE_KEY_EXPIRES = 'vidsetu_oauth_expires';
const STORAGE_KEY_USER = 'vidsetu_user_profile';
const STORAGE_KEY_CLIENT_ID = 'vidsetu_custom_client_id';

// Google Drive required scopes
// Requesting single full drive scope eliminates multiple fragmented permission checkboxes
export const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

class GoogleAuthService {
  private tokenClient: GoogleTokenClient | null = null;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private userProfile: GoogleUser | null = null;
  private tokenPromiseResolver: ((token: string) => void) | null = null;
  private tokenPromiseRejecter: ((err: Error) => void) | null = null;

  constructor() {
    this.loadPersistedAuth();
  }

  public getClientId(): string {
    const envClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
    const storedCustom = localStorage.getItem(STORAGE_KEY_CLIENT_ID);
    return (storedCustom || envClientId || '').trim();
  }

  public setCustomClientId(clientId: string): void {
    if (clientId) {
      localStorage.setItem(STORAGE_KEY_CLIENT_ID, clientId.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_CLIENT_ID);
    }
    this.tokenClient = null; // force re-init
  }

  private loadPersistedAuth() {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    const expires = localStorage.getItem(STORAGE_KEY_EXPIRES);
    const user = localStorage.getItem(STORAGE_KEY_USER);

    if (token && expires) {
      const expTimestamp = parseInt(expires, 10);
      if (Date.now() < expTimestamp - 60000) { // at least 1 min valid
        this.accessToken = token;
        this.tokenExpiresAt = expTimestamp;
        if (user) {
          try {
            this.userProfile = JSON.parse(user);
          } catch {
            this.userProfile = null;
          }
        }
      } else {
        this.clearAuth();
      }
    }
  }

  public async initClient(): Promise<boolean> {
    const clientId = this.getClientId();
    if (!clientId) {
      return false;
    }

    if (this.tokenClient) return true;

    // Wait for window.google.accounts to be available
    let attempts = 0;
    while (!window.google?.accounts?.oauth2 && attempts < 20) {
      await new Promise((r) => setTimeout(r, 150));
      attempts++;
    }

    if (!window.google?.accounts?.oauth2) {
      throw new Error('Google Identity Services script failed to load. Check your network or ad blocker.');
    }

    this.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: REQUIRED_SCOPES,
      callback: (response: GoogleTokenResponse) => {
        if (response.error) {
          const err = new Error(response.error_description || response.error);
          if (this.tokenPromiseRejecter) this.tokenPromiseRejecter(err);
          return;
        }

        this.accessToken = response.access_token;
        this.tokenExpiresAt = Date.now() + (response.expires_in * 1000);
        localStorage.setItem(STORAGE_KEY_TOKEN, response.access_token);
        localStorage.setItem(STORAGE_KEY_EXPIRES, this.tokenExpiresAt.toString());

        if (this.tokenPromiseResolver) {
          this.tokenPromiseResolver(response.access_token);
        }
      },
      error_callback: (err: unknown) => {
        const error = new Error(typeof err === 'string' ? err : 'Google OAuth initialization or popup error');
        if (this.tokenPromiseRejecter) this.tokenPromiseRejecter(error);
      }
    });

    return true;
  }

  public async login(): Promise<GoogleUser> {
    const clientId = this.getClientId();
    if (!clientId) {
      throw new Error('Google Client ID is missing. Please configure VITE_GOOGLE_CLIENT_ID.');
    }

    // Force clear any old token before re-authenticating with new scopes
    this.clearAuth();
    this.tokenClient = null;

    await this.initClient();

    if (!this.tokenClient) {
      throw new Error('Could not initialize Google OAuth client.');
    }

    const token = await new Promise<string>((resolve, reject) => {
      this.tokenPromiseResolver = resolve;
      this.tokenPromiseRejecter = reject;
      // Prompt user consent so Google explicitly grants the full drive scope
      this.tokenClient!.requestAccessToken({ prompt: 'consent' });
    });

    // Fetch user profile
    const profile = await this.fetchUserProfile(token);
    this.userProfile = profile;
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
    return profile;
  }

  public async getValidAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 60000) {
      return this.accessToken;
    }

    // Attempt re-auth with consent if needed
    await this.initClient();
    if (!this.tokenClient) {
      throw new Error('Not authenticated. Please sign in with Google.');
    }

    const token = await new Promise<string>((resolve, reject) => {
      this.tokenPromiseResolver = resolve;
      this.tokenPromiseRejecter = reject;
      this.tokenClient!.requestAccessToken({ prompt: 'consent' });
    });

    return token;
  }

  private async fetchUserProfile(token: string): Promise<GoogleUser> {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error('Failed to fetch Google profile info');
    }

    const data = await res.json();
    return {
      id: data.sub,
      name: data.name || data.email,
      email: data.email,
      picture: data.picture || '',
    };
  }

  public logout(): void {
    if (this.accessToken && window.google?.accounts?.oauth2) {
      try {
        fetch(`https://oauth2.googleapis.com/revoke?token=${this.accessToken}`, {
          method: 'POST',
          headers: { 'Content-type': 'application/x-www-form-urlencoded' }
        }).catch(() => { });
      } catch { }
    }
    this.clearAuth();
  }

  private clearAuth(): void {
    this.accessToken = null;
    this.tokenExpiresAt = 0;
    this.userProfile = null;
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_EXPIRES);
    localStorage.removeItem(STORAGE_KEY_USER);
  }

  public isAuthenticated(): boolean {
    return !!(this.accessToken && Date.now() < this.tokenExpiresAt - 60000);
  }

  public getUserProfile(): GoogleUser | null {
    return this.userProfile;
  }
}

export const googleAuth = new GoogleAuthService();

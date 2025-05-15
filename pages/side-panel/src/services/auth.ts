import { ApiClient } from './api';

interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthResponse {
  jwt: string;
  user: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

class AuthService {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient(import.meta.env.VITE_FRONTEND_URL);
  }

  async authenticateWithGoogle(googleUserInfo: GoogleUserInfo, googleAccessToken: string): Promise<AuthResponse> {
    return this.apiClient.post<AuthResponse>('/api/auth/from-extension', {
      googleUserInfo,
      googleAccessToken,
    });
  }

  async saveUserSession(jwt: string, userInfo: UserInfo): Promise<void> {
    return new Promise<void>(resolve => {
      chrome.storage.local.set(
        {
          appToken: jwt,
          userInfo: userInfo,
        },
        () => {
          resolve();
        },
      );
    });
  }

  async logout(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: false }, function (token) {
        if (token) {
          fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`)
            .then(() => {
              chrome.identity.removeCachedAuthToken({ token: token }, function () {
                chrome.storage.local.remove(['appToken', 'userInfo'], function () {
                  resolve();
                });
              });
            })
            .catch(error => {
              console.error('Error revoking token:', error);
              reject(error);
            });
        } else {
          chrome.storage.local.remove(['appToken', 'userInfo'], function () {
            resolve();
          });
        }
      });
    });
  }

  async getCurrentUser(): Promise<UserInfo | null> {
    return new Promise<UserInfo | null>(resolve => {
      chrome.storage.local.get(['userInfo'], function (result) {
        resolve(result.userInfo || null);
      });
    });
  }

  async getToken(): Promise<string | null> {
    return new Promise<string | null>(resolve => {
      chrome.storage.local.get(['appToken'], function (result) {
        resolve(result.appToken || null);
      });
    });
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }
}

export const authService = new AuthService();

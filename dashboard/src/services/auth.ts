/**
 * Authentication service - handles user login, logout, and session management.
 */

import { apiClient } from './api';

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  role?: string;
  permissions?: Record<string, string> | string[];
  token?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

class AuthService {
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    
    if (response.token) {
      apiClient.setToken(response.token);
    }
    
    return response;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout', {});
    } finally {
      apiClient.clearToken();
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get<User>('/auth/me');
      return response;
    } catch {
      return null;
    }
  }

  async refreshToken(): Promise<string> {
    const response = await apiClient.post<{ token: string }>('/auth/refresh', {});
    apiClient.setToken(response.token);
    return response.token;
  }

  isAuthenticated(): boolean {
    try {
      const user = localStorage.getItem('mg_user');
      return user !== null && JSON.parse(user).token !== undefined;
    } catch {
      return false;
    }
  }

  getStoredUser(): User | null {
    try {
      const user = localStorage.getItem('mg_user');
      return user ? (JSON.parse(user) as User) : null;
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();
export default authService;

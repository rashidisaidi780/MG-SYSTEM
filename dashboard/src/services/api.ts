/**
 * Base API client for all backend requests.
 * Handles authentication, error handling, and request/response interceptors.
 */

export interface ApiConfig {
  baseUrl: string;
  timeout?: number;
}

export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private token: string | null = null;

  constructor(config: ApiConfig) {
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout || 30000;
    this.loadToken();
  }

  private loadToken() {
    try {
      const user = localStorage.getItem('mg_user');
      if (user) {
        const parsed = JSON.parse(user);
        this.token = parsed.token;
      }
    } catch {
      // Token not available
    }
  }

  setToken(token: string) {
    this.token = token;
    try {
      const user = localStorage.getItem('mg_user');
      if (user) {
        const parsed = JSON.parse(user);
        localStorage.setItem('mg_user', JSON.stringify({ ...parsed, token }));
      }
    } catch {
      // Unable to store token
    }
  }

  clearToken() {
    this.token = null;
    try {
      localStorage.removeItem('mg_user');
    } catch {
      // Unable to clear token
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    let data: unknown;

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const error: ApiError = {
        status: response.status,
        message: response.statusText,
        details: data,
      };

      // If 401, clear token and redirect to login handled by caller
      if (response.status === 401) {
        this.clearToken();
        window.dispatchEvent(new Event('auth-expired'));
      }

      throw error;
    }

    return data as T;
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const signal = AbortSignal.timeout(this.timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        signal,
        ...options,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const signal = AbortSignal.timeout(this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
        signal,
        ...options,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const signal = AbortSignal.timeout(this.timeout);

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
        signal,
        ...options,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async patch<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const signal = AbortSignal.timeout(this.timeout);

    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
        signal,
        ...options,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const signal = AbortSignal.timeout(this.timeout);

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders(),
        signal,
        ...options,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  private handleError(error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error('Request timeout');
    } else if (error instanceof Error) {
      console.error('API request failed:', error.message);
    }
  }
}

// Initialize with environment variable or default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const apiClient = new ApiClient({
  baseUrl: API_BASE_URL,
  timeout: 30000,
});

export default apiClient;

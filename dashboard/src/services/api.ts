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
  private activeRequests = 0;
  private requestSequence = 0;

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

  private beginRequest(endpoint: string): () => void {
    const requestId = `${++this.requestSequence}:${endpoint}`;
    this.activeRequests += 1;
    window.dispatchEvent(new CustomEvent('api-request-progress', {
      detail: { activeRequests: this.activeRequests, requestId, phase: 'started' },
    }));

    let completed = false;
    return () => {
      if (completed) return;
      completed = true;
      this.activeRequests = Math.max(0, this.activeRequests - 1);
      window.dispatchEvent(new CustomEvent('api-request-progress', {
        detail: { activeRequests: this.activeRequests, requestId, phase: 'finished' },
      }));
    };
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const signal = AbortSignal.timeout(this.timeout);
    const finishRequest = this.beginRequest(endpoint);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        signal,
        ...options,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      this.handleError(error);
      throw error;
    } finally {
      finishRequest();
    }
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const signal = AbortSignal.timeout(this.timeout);
    const finishRequest = this.beginRequest(endpoint);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
        signal,
        ...options,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      this.handleError(error);
      throw error;
    } finally {
      finishRequest();
    }
  }

  async postForm<T>(endpoint: string, data: FormData): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const finishRequest = this.beginRequest(endpoint);
    const headers: Record<string, string> = { Accept: 'application/json' };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.timeout = Math.max(this.timeout, 120000);
        Object.entries(headers).forEach(([name, value]) => xhr.setRequestHeader(name, value));

        window.dispatchEvent(new CustomEvent('api-upload-progress', {
          detail: { active: true, loaded: 0, total: 0, computable: false },
        }));
        xhr.upload.addEventListener('progress', (event) => {
          window.dispatchEvent(new CustomEvent('api-upload-progress', {
            detail: {
              active: true,
              loaded: event.loaded,
              total: event.total,
              computable: event.lengthComputable,
            },
          }));
        });
        xhr.addEventListener('load', () => {
          if (xhr.status === 0) {
            reject(new Error('The upload request did not receive a response.'));
            return;
          }

          const responseHeaders = new Headers();
          xhr.getAllResponseHeaders().trim().split(/[\r\n]+/).forEach((line) => {
            const separator = line.indexOf(':');
            if (separator > 0) {
              responseHeaders.append(line.slice(0, separator).trim(), line.slice(separator + 1).trim());
            }
          });
          resolve(new Response(xhr.responseText, {
            status: xhr.status,
            statusText: xhr.statusText,
            headers: responseHeaders,
          }));
        });
        xhr.addEventListener('error', () => reject(new Error('The upload failed due to a network error.')));
        xhr.addEventListener('timeout', () => reject(new Error('The upload request timed out.')));
        xhr.addEventListener('abort', () => reject(new Error('The upload request was aborted.')));
        xhr.send(data);
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      this.handleError(error);
      throw error;
    } finally {
      window.dispatchEvent(new CustomEvent('api-upload-progress', {
        detail: { active: false, loaded: 0, total: 0, computable: false },
      }));
      finishRequest();
    }
  }

  async download(endpoint: string): Promise<Blob> {
    const url = `${this.baseUrl}${endpoint}`;
    const signal = AbortSignal.timeout(this.timeout);
    const headers: Record<string, string> = { Accept: '*/*' };
    const finishRequest = this.beginRequest(endpoint);

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, { method: 'GET', headers, signal });

      if (!response.ok) {
        await this.handleResponse(response);
      }

      return await response.blob();
    } catch (error) {
      this.handleError(error);
      throw error;
    } finally {
      finishRequest();
    }
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const signal = AbortSignal.timeout(this.timeout);
    const finishRequest = this.beginRequest(endpoint);

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
        signal,
        ...options,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      this.handleError(error);
      throw error;
    } finally {
      finishRequest();
    }
  }

  async patch<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const signal = AbortSignal.timeout(this.timeout);
    const finishRequest = this.beginRequest(endpoint);

    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
        signal,
        ...options,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      this.handleError(error);
      throw error;
    } finally {
      finishRequest();
    }
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const signal = AbortSignal.timeout(this.timeout);
    const finishRequest = this.beginRequest(endpoint);

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders(),
        signal,
        ...options,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      this.handleError(error);
      throw error;
    } finally {
      finishRequest();
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

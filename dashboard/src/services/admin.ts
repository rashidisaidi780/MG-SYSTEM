/**
 * Admin service - handles admin-specific operations like creating users
 */

import { apiClient } from './api';

export interface CreateUserRequest {
  user_id: string;
  user_name: string;
  user_email: string;
  user_password: string;
  department_id?: number;
  user_role: 'Admin' | 'Manager' | 'Employee' | 'Guest' | 'Sub User' | 'Accountant';
  user_status?: 'Active' | 'Inactive' | 'Suspended';
  permissions?: Record<string, 'None' | 'View' | 'Edit' | 'Both'>;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  permissions?: Record<string, 'None' | 'View' | 'Edit' | 'Both'>;
}

export interface PaginatedUsers {
  data: any[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

interface ApiEnvelope<T> {
  data: T;
}

class AdminService {
  /**
   * Create a new user (admin only)
   */
  async createUser(data: CreateUserRequest): Promise<UserResponse> {
    const response = await apiClient.post<ApiEnvelope<UserResponse>>('/admin/users', data);
    return response.data;
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(page: number = 1, limit: number = 20): Promise<PaginatedUsers> {
    const response = await apiClient.get<ApiEnvelope<PaginatedUsers>>(`/admin/users?page=${page}&per_page=${limit}`);
    return response.data;
  }

  /**
   * Delete a user (admin only)
   */
  async deleteUser(userId: string): Promise<void> {
    await apiClient.delete(`/admin/users/${userId}`);
  }

  async updateUser(userId: string, data: Partial<CreateUserRequest>): Promise<UserResponse> {
    const response = await apiClient.put<ApiEnvelope<UserResponse>>(`/admin/users/${userId}`, data);
    return response.data;
  }

  /**
   * Get current admin info
   */
  async getCurrentAdmin() {
    return apiClient.get('/admin/me');
  }

  /**
   * Logout admin
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/admin/logout', {});
    } finally {
      apiClient.clearToken();
    }
  }
}

export const adminService = new AdminService();
export default adminService;

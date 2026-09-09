/**
 * Users service - handles user account management operations.
 */

import { apiClient } from './api';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Employee' | 'Guest';
  department: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: User['role'];
  department: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  role?: User['role'];
  department?: string;
  status?: User['status'];
}

class UsersService {
  async getAll(params?: { search?: string; role?: string; status?: string; page?: number; limit?: number }): Promise<User[]> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/users?${queryString}` : '/users';
    
    return apiClient.get<User[]>(endpoint);
  }

  async getById(id: string): Promise<User> {
    return apiClient.get<User>(`/users/${id}`);
  }

  async create(data: CreateUserRequest): Promise<User> {
    return apiClient.post<User>('/users', data);
  }

  async update(id: string, data: UpdateUserRequest): Promise<User> {
    return apiClient.put<User>(`/users/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  }

  async changePassword(id: string, oldPassword: string, newPassword: string): Promise<void> {
    await apiClient.post(`/users/${id}/change-password`, { oldPassword, newPassword });
  }

  async resetPassword(id: string): Promise<{ tempPassword: string }> {
    return apiClient.post<{ tempPassword: string }>(`/users/${id}/reset-password`, {});
  }
}

export const usersService = new UsersService();
export default usersService;

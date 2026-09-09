/**
 * Workers service - handles worker/staff management operations.
 */

import { apiClient } from './api';

export interface Worker {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  hireDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateWorkerRequest {
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hireDate: string;
}

export interface UpdateWorkerRequest {
  name?: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  status?: Worker['status'];
  hireDate?: string;
}

class WorkersService {
  async getAll(params?: { search?: string; department?: string; status?: string; page?: number; limit?: number }): Promise<Worker[]> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.department) queryParams.append('department', params.department);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/workers?${queryString}` : '/workers';
    
    return apiClient.get<Worker[]>(endpoint);
  }

  async getById(id: string): Promise<Worker> {
    return apiClient.get<Worker>(`/workers/${id}`);
  }

  async create(data: CreateWorkerRequest): Promise<Worker> {
    return apiClient.post<Worker>('/workers', data);
  }

  async update(id: string, data: UpdateWorkerRequest): Promise<Worker> {
    return apiClient.put<Worker>(`/workers/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/workers/${id}`);
  }

  async updateStatus(id: string, status: Worker['status']): Promise<Worker> {
    return apiClient.patch<Worker>(`/workers/${id}`, { status });
  }
}

export const workersService = new WorkersService();
export default workersService;

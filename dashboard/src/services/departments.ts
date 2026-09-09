/**
 * Departments service - handles department management operations.
 */

import { apiClient } from './api';

export interface Department {
  id: string;
  name: string;
  description: string;
  manager: string;
  headCount: number;
  budget: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDepartmentRequest {
  name: string;
  description: string;
  manager: string;
  budget: number;
}

export interface UpdateDepartmentRequest {
  name?: string;
  description?: string;
  manager?: string;
  budget?: number;
  headCount?: number;
}

class DepartmentsService {
  async getAll(params?: { search?: string; page?: number; limit?: number }): Promise<Department[]> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/departments?${queryString}` : '/departments';
    
    return apiClient.get<Department[]>(endpoint);
  }

  async getById(id: string): Promise<Department> {
    return apiClient.get<Department>(`/departments/${id}`);
  }

  async create(data: CreateDepartmentRequest): Promise<Department> {
    return apiClient.post<Department>('/departments', data);
  }

  async update(id: string, data: UpdateDepartmentRequest): Promise<Department> {
    return apiClient.put<Department>(`/departments/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/departments/${id}`);
  }

  async getMembers(id: string): Promise<{ id: string; name: string }[]> {
    return apiClient.get<{ id: string; name: string }[]>(`/departments/${id}/members`);
  }
}

export const departmentsService = new DepartmentsService();
export default departmentsService;

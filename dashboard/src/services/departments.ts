/**
 * Departments service - handles department management operations.
 */

import { apiClient } from './api';

export interface Department {
  id: string;
  name: string;
  description: string;
  head: string;
  peopleCount: number;
  status: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDepartmentRequest {
  name: string;
  description: string;
  head: string;
  peopleCount?: number;
  status: 'Active' | 'Inactive';
}

export interface UpdateDepartmentRequest {
  name?: string;
  description?: string;
  head?: string;
  peopleCount?: number;
  status?: 'Active' | 'Inactive';
}

interface DepartmentApiRecord {
  id: number | string;
  department_id: string;
  department_name: string;
  department_description: string | null;
  department_head: string | null;
  number_of_people: number;
  department_status: string;
  created_at?: string;
  updated_at?: string;
}

interface DepartmentApiResponse {
  data: DepartmentApiRecord[];
}

const toDepartment = (department: DepartmentApiRecord): Department => ({
  id: String(department.id),
  name: department.department_name,
  description: department.department_description ?? '',
  head: department.department_head ?? '',
  peopleCount: department.number_of_people,
  status: department.department_status.toLowerCase() === 'inactive' ? 'Inactive' : 'Active',
  createdAt: department.created_at,
  updatedAt: department.updated_at,
});

const toApiPayload = (department: CreateDepartmentRequest | UpdateDepartmentRequest) => ({
  ...(department.name !== undefined ? { department_name: department.name } : {}),
  ...(department.description !== undefined ? { department_description: department.description } : {}),
  ...(department.head !== undefined ? { department_head: department.head } : {}),
  ...(department.peopleCount !== undefined ? { number_of_people: department.peopleCount } : {}),
  ...(department.status !== undefined ? { department_status: department.status.toLowerCase() } : {}),
});

class DepartmentsService {
  async getAll(params?: { search?: string; page?: number; limit?: number }): Promise<Department[]> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/departments?${queryString}` : '/departments';
    
    const response = await apiClient.get<DepartmentApiResponse>(endpoint);
    return response.data.map(toDepartment);
  }

  async getById(id: string): Promise<Department> {
    const response = await apiClient.get<{ data: DepartmentApiRecord }>(`/departments/${id}`);
    return toDepartment(response.data);
  }

  async create(data: CreateDepartmentRequest): Promise<Department> {
    const response = await apiClient.post<{ data: DepartmentApiRecord }>('/departments', {
      department_id: `DEP-${Date.now()}`,
      ...toApiPayload(data),
    });
    return toDepartment(response.data);
  }

  async update(id: string, data: UpdateDepartmentRequest): Promise<Department> {
    const response = await apiClient.put<{ data: DepartmentApiRecord }>(`/departments/${id}`, toApiPayload(data));
    return toDepartment(response.data);
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

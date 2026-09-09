/**
 * Projects service - handles project management operations.
 */

import { apiClient } from './api';

export interface Project {
  id: string;
  name: string;
  description: string;
  client: string;
  status: 'Active' | 'Completed' | 'On Hold' | 'Canceled';
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  team: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProjectRequest {
  name: string;
  description: string;
  client: string;
  status?: Project['status'];
  startDate: string;
  endDate: string;
  budget: number;
  team?: string[];
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  client?: string;
  status?: Project['status'];
  startDate?: string;
  endDate?: string;
  budget?: number;
  spent?: number;
  team?: string[];
}

class ProjectsService {
  async getAll(params?: { search?: string; status?: string; page?: number; limit?: number }): Promise<Project[]> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/projects?${queryString}` : '/projects';
    
    return apiClient.get<Project[]>(endpoint);
  }

  async getById(id: string): Promise<Project> {
    return apiClient.get<Project>(`/projects/${id}`);
  }

  async create(data: CreateProjectRequest): Promise<Project> {
    return apiClient.post<Project>('/projects', data);
  }

  async update(id: string, data: UpdateProjectRequest): Promise<Project> {
    return apiClient.put<Project>(`/projects/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/projects/${id}`);
  }

  async updateStatus(id: string, status: Project['status']): Promise<Project> {
    return apiClient.patch<Project>(`/projects/${id}`, { status });
  }
}

export const projectsService = new ProjectsService();
export default projectsService;

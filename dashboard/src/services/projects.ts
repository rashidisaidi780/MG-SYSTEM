/**
 * Projects service - handles project management operations.
 */

import { apiClient } from './api';

export interface Project {
  id: string;
  name: string;
  description: string;
  client: string;
  status: 'In Progress' | 'Planning' | 'Review' | 'Completed' | 'On Hold';
  startDate: string;
  endDate: string;
  budget: number;
  progress: number;
  spent: number;
  team: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface ProjectApiRecord {
  id: number | string;
  project_name: string;
  project_budget: number | string;
  project_status: string;
  project_progress: number;
  project_start_date: string;
  project_end_date: string | null;
  project_details: string | null;
  client_id: number | string;
}

export interface CreateProjectRequest {
  id?: string;
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
  id?: string;
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
  async getCount(): Promise<number> {
    const response = await apiClient.get<{ data: { total?: number } }>('/projects?limit=1');
    return response.data.total ?? 0;
  }

  async getAll(params?: { search?: string; status?: string; page?: number; limit?: number }): Promise<Project[]> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/projects?${queryString}` : '/projects';
    
    const response = await apiClient.get<{ data: { data: ProjectApiRecord[] } | ProjectApiRecord[] }>(endpoint);
    const records = Array.isArray(response.data) ? response.data : response.data.data;
    return records.map(toProject);
  }

  async getById(id: string): Promise<Project> {
    const response = await apiClient.get<{ data: ProjectApiRecord }>(`/projects/${id}`);
    return toProject(response.data);
  }

  async create(data: CreateProjectRequest): Promise<Project> {
    const response = await apiClient.post<{ data: ProjectApiRecord }>('/projects', toProjectPayload(data, true));
    return toProject(response.data);
  }

  async update(id: string, data: UpdateProjectRequest): Promise<Project> {
    const response = await apiClient.put<{ data: ProjectApiRecord }>(`/projects/${id}`, toProjectPayload(data, false));
    return toProject(response.data);
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

const toProject = (project: ProjectApiRecord): Project => ({
  id: String(project.id), name: project.project_name, description: project.project_details ?? '', client: String(project.client_id),
  status: project.project_status.toLowerCase() === 'completed' ? 'Completed' : project.project_status.toLowerCase() === 'on hold' ? 'On Hold' : project.project_status.toLowerCase() === 'in progress' ? 'In Progress' : 'Planning',
  startDate: project.project_start_date, endDate: project.project_end_date ?? '', budget: Number(project.project_budget), progress: project.project_progress ?? 0, spent: 0, team: [],
});

const toProjectPayload = (project: CreateProjectRequest | UpdateProjectRequest, includeProjectId: boolean) => ({
  ...(includeProjectId ? { project_id: Number(project.id) || Date.now() } : {}),
  ...(project.name !== undefined ? { project_name: project.name } : {}),
  ...(project.description !== undefined ? { project_details: project.description } : {}),
  ...(project.client !== undefined ? { client_id: Number(project.client) } : {}),
  ...(project.status !== undefined ? { project_status: project.status.toLowerCase() } : {}),
  ...(project.startDate !== undefined ? { project_start_date: project.startDate } : {}),
  ...(project.endDate !== undefined ? { project_end_date: project.endDate || null } : {}),
  ...(project.budget !== undefined ? { project_budget: project.budget } : {}),
  ...('progress' in project && project.progress !== undefined ? { project_progress: project.progress } : {}),
});

/**
 * Clients service - handles client management operations.
 */

import { apiClient } from './api';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  tin: string;
  address: string;
  country: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateClientRequest {
  name: string;
  email: string;
  phone: string;
  company: string;
  tin: string;
  address: string;
  country: string;
}

export interface UpdateClientRequest {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  tin?: string;
  address?: string;
  country?: string;
}

class ClientsService {
  async getAll(params?: { search?: string; page?: number; limit?: number }): Promise<Client[]> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/clients?${queryString}` : '/clients';
    
    return apiClient.get<Client[]>(endpoint);
  }

  async getById(id: string): Promise<Client> {
    return apiClient.get<Client>(`/clients/${id}`);
  }

  async create(data: CreateClientRequest): Promise<Client> {
    return apiClient.post<Client>('/clients', data);
  }

  async update(id: string, data: UpdateClientRequest): Promise<Client> {
    return apiClient.put<Client>(`/clients/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/clients/${id}`);
  }
}

export const clientsService = new ClientsService();
export default clientsService;

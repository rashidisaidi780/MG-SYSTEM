/**
 * Clients service - handles client management operations.
 */

import { apiClient } from './api';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  otherPhone: string;
  company: string;
  tin: string;
  address: string;
  country: string;
  status: 'Active' | 'Inactive' | 'Pending';
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ClientApiRecord {
  id: number | string;
  client_id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string;
  client_address: string | null;
  client_otherphone: string | null;
  client_status: string;
  client_tin: string | null;
  client_date_added: string | null;
  client_company: string | null;
  client_country: string | null;
  created_at?: string;
  updated_at?: string;
}

interface ClientApiResponse {
  data: ClientApiRecord[];
}

export interface CreateClientRequest {
  name: string;
  email: string;
  phone: string;
  company: string;
  tin: string;
  address: string;
  country: string;
  otherPhone?: string;
  status?: Client['status'];
  date?: string;
}

export interface UpdateClientRequest {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  tin?: string;
  address?: string;
  country?: string;
  otherPhone?: string;
  status?: Client['status'];
  date?: string;
}

const toClient = (client: ClientApiRecord): Client => ({
  id: String(client.id),
  name: client.client_name,
  email: client.client_email ?? '',
  phone: client.client_phone,
  company: client.client_company ?? '',
  tin: client.client_tin ?? '',
  address: client.client_address ?? '',
  country: client.client_country ?? '',
  status: client.client_status.toLowerCase() === 'inactive' ? 'Inactive' : client.client_status.toLowerCase() === 'pending' ? 'Pending' : 'Active',
  date: client.client_date_added ?? client.created_at?.slice(0, 10) ?? '',
  otherPhone: client.client_otherphone ?? '',
  createdAt: client.created_at,
  updatedAt: client.updated_at,
});

const toApiPayload = (client: CreateClientRequest | UpdateClientRequest) => ({
  ...(client.name !== undefined ? { client_name: client.name } : {}),
  ...(client.email !== undefined ? { client_email: client.email } : {}),
  ...(client.phone !== undefined ? { client_phone: client.phone } : {}),
  ...(client.company !== undefined ? { client_company: client.company } : {}),
  ...(client.tin !== undefined ? { client_tin: client.tin } : {}),
  ...(client.address !== undefined ? { client_address: client.address } : {}),
  ...(client.country !== undefined ? { client_country: client.country } : {}),
  ...(client.otherPhone !== undefined ? { client_otherphone: client.otherPhone } : {}),
  ...(client.status !== undefined ? { client_status: client.status.toLowerCase() } : {}),
  ...(client.date !== undefined ? { client_date_added: client.date } : {}),
});

class ClientsService {
  async getAll(params?: { search?: string; page?: number; limit?: number }): Promise<Client[]> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/clients?${queryString}` : '/clients';
    
    const response = await apiClient.get<ClientApiResponse>(endpoint);
    return response.data.map(toClient);
  }

  async getById(id: string): Promise<Client> {
    const response = await apiClient.get<{ data: ClientApiRecord }>(`/clients/${id}`);
    return toClient(response.data);
  }

  async create(data: CreateClientRequest): Promise<Client> {
    const response = await apiClient.post<{ data: ClientApiRecord }>('/clients', {
      client_id: `CL-${Date.now()}`,
      ...toApiPayload(data),
    });
    return toClient(response.data);
  }

  async update(id: string, data: UpdateClientRequest): Promise<Client> {
    const response = await apiClient.put<{ data: ClientApiRecord }>(`/clients/${id}`, {
      ...toApiPayload(data),
    });
    return toClient(response.data);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/clients/${id}`);
  }
}

export const clientsService = new ClientsService();
export default clientsService;

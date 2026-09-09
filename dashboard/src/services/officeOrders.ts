/**
 * Office Orders service - handles internal office purchase orders.
 */

import { apiClient } from './api';

export interface OfficeOrder {
  id: string;
  item: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  department: string;
  requestedBy: string;
  status: 'Pending' | 'Approved' | 'Ordered' | 'Received' | 'Rejected';
  requestDate: string;
  deliveryDate?: string;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOfficeOrderRequest {
  item: string;
  quantity: number;
  unitPrice: number;
  department: string;
  requestedBy: string;
  requestDate: string;
  notes?: string;
}

export interface UpdateOfficeOrderRequest {
  item?: string;
  quantity?: number;
  unitPrice?: number;
  department?: string;
  status?: OfficeOrder['status'];
  deliveryDate?: string;
  notes?: string;
}

class OfficeOrdersService {
  async getAll(params?: { search?: string; status?: string; department?: string; page?: number; limit?: number }): Promise<OfficeOrder[]> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.department) queryParams.append('department', params.department);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/office-orders?${queryString}` : '/office-orders';
    
    return apiClient.get<OfficeOrder[]>(endpoint);
  }

  async getById(id: string): Promise<OfficeOrder> {
    return apiClient.get<OfficeOrder>(`/office-orders/${id}`);
  }

  async create(data: CreateOfficeOrderRequest): Promise<OfficeOrder> {
    return apiClient.post<OfficeOrder>('/office-orders', data);
  }

  async update(id: string, data: UpdateOfficeOrderRequest): Promise<OfficeOrder> {
    return apiClient.put<OfficeOrder>(`/office-orders/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/office-orders/${id}`);
  }

  async updateStatus(id: string, status: OfficeOrder['status']): Promise<OfficeOrder> {
    return apiClient.patch<OfficeOrder>(`/office-orders/${id}`, { status });
  }

  async approve(id: string): Promise<OfficeOrder> {
    return apiClient.patch<OfficeOrder>(`/office-orders/${id}`, { status: 'Approved' });
  }

  async reject(id: string): Promise<OfficeOrder> {
    return apiClient.patch<OfficeOrder>(`/office-orders/${id}`, { status: 'Rejected' });
  }
}

export const officeOrdersService = new OfficeOrdersService();
export default officeOrdersService;

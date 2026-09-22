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

interface OfficeOrderApiRecord {
  id: number | string;
  order_id: string;
  department_id: number | string | null;
  order_subject: string;
  requester_name: string;
  order_date: string;
  order_status: string;
  order_notes: string | null;
  department?: { department_name?: string; name?: string } | null;
}

export interface CreateOfficeOrderRequest {
  id?: string;
  item: string;
  quantity: number;
  unitPrice: number;
  department: string;
  requestedBy: string;
  requestDate: string;
  notes?: string;
  status?: OfficeOrder['status'];
}

export interface UpdateOfficeOrderRequest {
  id?: string;
  item?: string;
  quantity?: number;
  unitPrice?: number;
  department?: string;
  status?: OfficeOrder['status'];
  deliveryDate?: string;
  notes?: string;
  requestedBy?: string;
  requestDate?: string;
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
    const endpoint = queryString ? `/officeorders?${queryString}` : '/officeorders';
    const response = await apiClient.get<{ data: OfficeOrderApiRecord[] }>(endpoint);
    return response.data.map(toOfficeOrder);
  }

  async getById(id: string): Promise<OfficeOrder> {
    const response = await apiClient.get<{ data: OfficeOrderApiRecord }>(`/officeorders/${id}`);
    return toOfficeOrder(response.data);
  }

  async create(data: CreateOfficeOrderRequest): Promise<OfficeOrder> {
    const response = await apiClient.post<{ data: OfficeOrderApiRecord }>('/officeorders', toOfficeOrderPayload(data));
    return toOfficeOrder(response.data);
  }

  async update(id: string, data: UpdateOfficeOrderRequest): Promise<OfficeOrder> {
    const response = await apiClient.put<{ data: OfficeOrderApiRecord }>(`/officeorders/${id}`, toOfficeOrderPayload(data));
    return toOfficeOrder(response.data);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/officeorders/${id}`);
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

const toOfficeOrder = (order: OfficeOrderApiRecord): OfficeOrder => ({
  id: order.order_id, item: order.order_subject, quantity: 1, unitPrice: 0, totalPrice: 0,
  department: order.department?.department_name ?? order.department?.name ?? String(order.department_id ?? ''),
  requestedBy: order.requester_name, status: order.order_status.toLowerCase() === 'completed' ? 'Received' : order.order_status.toLowerCase() === 'approved' ? 'Approved' : order.order_status.toLowerCase() === 'ordered' ? 'Ordered' : order.order_status.toLowerCase() === 'rejected' ? 'Rejected' : 'Pending',
  requestDate: order.order_date, notes: order.order_notes ?? '',
});

const toOfficeOrderPayload = (order: CreateOfficeOrderRequest | UpdateOfficeOrderRequest) => ({
  ...(order.id !== undefined ? { order_id: order.id } : {}),
  ...(order.item !== undefined ? { order_subject: order.item } : {}),
  ...(order.department !== undefined ? { department_name: order.department } : {}),
  ...(order.requestedBy !== undefined ? { requester_name: order.requestedBy } : {}),
  ...(order.requestDate !== undefined ? { order_date: order.requestDate } : {}),
  ...(order.status !== undefined ? { order_status: order.status.toLowerCase() } : {}),
  ...(order.notes !== undefined ? { order_notes: order.notes } : {}),
});

/**
 * Invoices service - handles all invoice CRUD operations.
 */

import { apiClient } from './api';

export interface InvoiceItem {
  desc: string;
  quantity: number;
  amount: number;
}

export interface Invoice {
  id: string;
  client: string;
  company?: string;
  tin?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  items?: InvoiceItem[];
  amount: string;
  paidAmount?: number;
  date: string;
  due: string;
  issuedRaw?: string;
  dueRaw?: string;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Canceled';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateInvoiceRequest {
  client: string;
  company?: string;
  tin?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  items: InvoiceItem[];
  date: string;
  due: string;
  notes?: string;
}

export interface UpdateInvoiceRequest {
  client?: string;
  company?: string;
  tin?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  items?: InvoiceItem[];
  date?: string;
  due?: string;
  status?: Invoice['status'];
  paidAmount?: number;
  notes?: string;
}

class InvoicesService {
  async getAll(params?: { search?: string; status?: string; page?: number; limit?: number }): Promise<Invoice[]> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/invoices?${queryString}` : '/invoices';
    
    return apiClient.get<Invoice[]>(endpoint);
  }

  async getById(id: string): Promise<Invoice> {
    return apiClient.get<Invoice>(`/invoices/${id}`);
  }

  async create(data: CreateInvoiceRequest): Promise<Invoice> {
    return apiClient.post<Invoice>('/invoices', data);
  }

  async update(id: string, data: UpdateInvoiceRequest): Promise<Invoice> {
    return apiClient.put<Invoice>(`/invoices/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/invoices/${id}`);
  }

  async updateStatus(id: string, status: Invoice['status']): Promise<Invoice> {
    return apiClient.patch<Invoice>(`/invoices/${id}`, { status });
  }

  async updatePayment(id: string, paidAmount: number): Promise<Invoice> {
    return apiClient.patch<Invoice>(`/invoices/${id}`, { paidAmount });
  }

  async generateInvoiceNumber(year?: number, month?: number): Promise<{ invoiceNumber: string }> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/invoices/generate/number?${queryString}` : '/invoices/generate/number';
    
    return apiClient.get<{ invoiceNumber: string }>(endpoint);
  }

  async exportPDF(id: string): Promise<Blob> {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/invoices/${id}/export/pdf`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('mg_user') && JSON.parse(localStorage.getItem('mg_user')!).token || ''}`,
        },
      }
    );

    if (!response.ok) throw new Error('Failed to export PDF');
    return response.blob();
  }
}

export const invoicesService = new InvoicesService();
export default invoicesService;

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

interface InvoiceApiRecord {
  id: number | string;
  invoice_id: string;
  client_id: number | string | null;
  client?: { client_name: string } | null;
  company_name: string;
  client_tin: string | null;
  client_email: string | null;
  client_phone: string | null;
  client_address: string | null;
  country: string | null;
  invoice_items: InvoiceItem[] | null;
  item_description: string;
  item_quantity: number;
  item_unit_price: number | string;
  invoice_total_amount: number | string;
  paid_amount: number | string;
  invoice_status: string;
  invoice_date: string;
  invoice_due_date: string | null;
  invoice_notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateInvoiceRequest {
  id: string;
  clientId: string;
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
  status?: Invoice['status'];
  paidAmount?: number;
  notes?: string;
}

export interface UpdateInvoiceRequest {
  id?: string;
  clientId?: string;
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
    
    const response = await apiClient.get<{ data: InvoiceApiRecord[] }>(endpoint);
    return response.data.map(toInvoice);
  }

  async getById(id: string): Promise<Invoice> {
    const response = await apiClient.get<{ data: InvoiceApiRecord }>(`/invoices/${id}`);
    return toInvoice(response.data);
  }

  async create(data: CreateInvoiceRequest): Promise<Invoice> {
    const response = await apiClient.post<{ data: InvoiceApiRecord }>('/invoices', toApiPayload(data));
    return toInvoice(response.data);
  }

  async update(id: string, data: UpdateInvoiceRequest): Promise<Invoice> {
    const response = await apiClient.put<{ data: InvoiceApiRecord }>(`/invoices/${id}`, toApiPayload(data));
    return toInvoice(response.data);
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

  async getOriginalCopyUrl(id: string): Promise<string> {
    const response = await apiClient.get<{ data: { url: string } }>(
      `/invoices/${encodeURIComponent(id)}/original-link`,
    );
    return response.data.url;
  }
}

const toInvoice = (invoice: InvoiceApiRecord): Invoice => ({
  id: invoice.invoice_id,
  client: invoice.client?.client_name ?? String(invoice.client_id ?? ''),
  company: invoice.company_name,
  tin: invoice.client_tin ?? '',
  email: invoice.client_email ?? '',
  phone: invoice.client_phone ?? '',
  address: invoice.client_address ?? '',
  country: invoice.country ?? '',
  items: invoice.invoice_items ?? [{ desc: invoice.item_description, quantity: invoice.item_quantity, amount: Number(invoice.item_unit_price) }],
  amount: `Tsh ${new Intl.NumberFormat('en-TZ', { maximumFractionDigits: 0 }).format(Number(invoice.invoice_total_amount))}`,
  paidAmount: Number(invoice.paid_amount),
  date: new Date(invoice.invoice_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  due: invoice.invoice_due_date ? new Date(invoice.invoice_due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
  issuedRaw: invoice.invoice_date,
  dueRaw: invoice.invoice_due_date ?? '',
  status: (invoice.invoice_status ?? 'unpaid').toLowerCase() === 'paid' ? 'Paid' : (invoice.invoice_status ?? 'unpaid').toLowerCase() === 'overdue' ? 'Overdue' : (invoice.invoice_status ?? 'unpaid').toLowerCase() === 'canceled' ? 'Canceled' : 'Pending',
  notes: invoice.invoice_notes ?? '',
  createdAt: invoice.created_at,
  updatedAt: invoice.updated_at,
});

const toApiPayload = (invoice: CreateInvoiceRequest | UpdateInvoiceRequest) => ({
  ...(invoice.clientId !== undefined ? { client_id: invoice.clientId } : {}),
  ...(invoice.id !== undefined ? { invoice_id: invoice.id } : {}),
  ...(invoice.company !== undefined ? { company_name: invoice.company || invoice.client } : {}),
  ...(invoice.tin !== undefined ? { client_tin: invoice.tin } : {}),
  ...(invoice.email !== undefined ? { client_email: invoice.email } : {}),
  ...(invoice.phone !== undefined ? { client_phone: invoice.phone } : {}),
  ...(invoice.address !== undefined ? { client_address: invoice.address } : {}),
  ...(invoice.country !== undefined ? { country: invoice.country } : {}),
  ...(invoice.items !== undefined ? { invoice_items: invoice.items } : {}),
  ...(invoice.date !== undefined ? { invoice_date: invoice.date } : {}),
  ...(invoice.due !== undefined ? { invoice_due_date: invoice.due || null } : {}),
  ...(invoice.status !== undefined ? { invoice_status: invoice.status.toLowerCase() } : {}),
  ...(invoice.paidAmount !== undefined ? { paid_amount: invoice.paidAmount } : {}),
  ...(invoice.notes !== undefined ? { invoice_notes: invoice.notes } : {}),
});

export const invoicesService = new InvoicesService();
export default invoicesService;

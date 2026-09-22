/**
 * Workers service - handles worker/staff management operations.
 */

import { apiClient } from './api';

export interface Worker {
  id: string;
  workerId?: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  status: 'Active' | 'On Leave' | 'Inactive' | 'Contract';
  hireDate: string;
  createdAt?: string;
  updatedAt?: string;
  tinNumber?: string;
  nidaNumber?: string;
  otherPhone?: string;
  salary?: string;
  durationValue?: number;
  contractEndDate?: string;
}

interface WorkerApiRecord {
  id: number | string;
  worker_id: string;
  worker_name: string;
  worker_email: string | null;
  worker_phone: string;
  worker_role: string | null;
    worker_tin: string | null;
    worker_nida: string | null;
    worker_otherphone: string | null;
    workers_salary: number | string;
    duration: number | null;
    worker_contact_end_date: string | null;
  worker_status: string;
  worker_contact_date: string | null;
  department?: { department_name?: string; name?: string } | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateWorkerRequest {
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hireDate: string;
  tinNumber?: string;
  nidaNumber?: string;
  otherPhone?: string;
  salary?: string;
  contractEndDate?: string;
}

export interface UpdateWorkerRequest {
  workerId?: string;
  name?: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  status?: Worker['status'];
  hireDate?: string;
  tinNumber?: string;
  nidaNumber?: string;
  otherPhone?: string;
  salary?: string;
  contractEndDate?: string;
}

class WorkersService {
  async getAll(params?: { search?: string; department?: string; status?: string; page?: number; limit?: number }): Promise<Worker[]> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.department) queryParams.append('department', params.department);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/workers?${queryString}` : '/workers';
    
    const response = await apiClient.get<{ data: WorkerApiRecord[] }>(endpoint);
    return response.data.map(toWorker);
  }

  async getById(id: string): Promise<Worker> {
    const response = await apiClient.get<{ data: WorkerApiRecord }>(`/workers/${id}`);
    return toWorker(response.data);
  }

  async create(data: CreateWorkerRequest): Promise<Worker> {
    const response = await apiClient.post<{ data: WorkerApiRecord }>('/workers', {
      worker_id: `WR-${Date.now()}`,
      worker_name: data.name,
      worker_email: data.email,
      worker_phone: data.phone,
      worker_role: data.position,
      worker_status: 'active',
      department_id: Number(data.department) || null,
      worker_contact_date: data.hireDate,
      worker_tin: data.tinNumber,
      worker_nida: data.nidaNumber,
      worker_otherphone: data.otherPhone,
      workers_salary: Number(data.salary) || 0,
      worker_contact_end_date: data.contractEndDate,
    });
    return toWorker(response.data);
  }

  async update(id: string, data: UpdateWorkerRequest): Promise<Worker> {
    const response = await apiClient.put<{ data: WorkerApiRecord }>(`/workers/${id}`, {
      worker_name: data.name,
      worker_email: data.email,
      worker_phone: data.phone,
      worker_role: data.position,
      worker_id: data.workerId,
      department_id: data.department === undefined ? undefined : Number(data.department) || null,
      worker_contact_date: data.hireDate,
      worker_status: data.status?.toLowerCase(),
      worker_tin: data.tinNumber,
      worker_nida: data.nidaNumber,
      worker_otherphone: data.otherPhone,
      workers_salary: Number(data.salary) || 0,
      worker_contact_end_date: data.contractEndDate,
    });
    return toWorker(response.data);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/workers/${id}`);
  }

  async updateStatus(id: string, status: Worker['status']): Promise<Worker> {
    const response = await apiClient.patch<{ data: WorkerApiRecord }>(`/workers/${id}`, { worker_status: status.toLowerCase() });
    return toWorker(response.data);
  }
}

const toWorker = (worker: WorkerApiRecord): Worker => ({
  id: String(worker.id),
  workerId: worker.worker_id,
  name: worker.worker_name,
  email: worker.worker_email ?? '',
  phone: worker.worker_phone,
  position: worker.worker_role ?? '',
  department: worker.department?.department_name ?? worker.department?.name ?? '',
  status: (worker.worker_status ?? 'active').toLowerCase() === 'on leave' ? 'On Leave' : (worker.worker_status ?? 'active').toLowerCase() === 'inactive' ? 'Contract' : 'Active',
  hireDate: worker.worker_contact_date ?? '',
    tinNumber: worker.worker_tin ?? '',
    nidaNumber: worker.worker_nida ?? '',
    otherPhone: worker.worker_otherphone ?? '',
    salary: String(worker.workers_salary ?? ''),
    durationValue: worker.duration ?? 1,
    contractEndDate: worker.worker_contact_end_date ?? '',
  createdAt: worker.created_at,
  updatedAt: worker.updated_at,
});

export const workersService = new WorkersService();
export default workersService;

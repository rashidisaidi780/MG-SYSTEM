/**
 * Bookings service - handles service booking and appointment operations.
 */

import { apiClient } from './api';

export interface Booking {
  id: string;
  client: string;
  service: string;
  date: string;
  time: string;
  status: 'Confirmed' | 'Pending' | 'Canceled' | 'Completed';
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBookingRequest {
  client: string;
  service: string;
  date: string;
  time: string;
  notes?: string;
}

export interface UpdateBookingRequest {
  client?: string;
  service?: string;
  date?: string;
  time?: string;
  status?: Booking['status'];
  notes?: string;
}

class BookingsService {
  async getAll(params?: { search?: string; status?: string; date?: string; page?: number; limit?: number }): Promise<Booking[]> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.date) queryParams.append('date', params.date);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/bookings?${queryString}` : '/bookings';
    
    return apiClient.get<Booking[]>(endpoint);
  }

  async getById(id: string): Promise<Booking> {
    return apiClient.get<Booking>(`/bookings/${id}`);
  }

  async create(data: CreateBookingRequest): Promise<Booking> {
    return apiClient.post<Booking>('/bookings', data);
  }

  async update(id: string, data: UpdateBookingRequest): Promise<Booking> {
    return apiClient.put<Booking>(`/bookings/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/bookings/${id}`);
  }

  async updateStatus(id: string, status: Booking['status']): Promise<Booking> {
    return apiClient.patch<Booking>(`/bookings/${id}`, { status });
  }
}

export const bookingsService = new BookingsService();
export default bookingsService;

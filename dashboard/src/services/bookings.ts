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
  assignee?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface BookingApiRecord {
  id: number | string;
  booking_id: string;
  client_id: number | string;
  service_id: number | string;
  assignee: number | string | null;
  booking_date: string;
  booking_time: string;
  booking_status: string;
  booking_notes: string | null;
  client?: { client_name: string } | null;
  service?: { service_name?: string; name?: string } | null;
  worker?: { worker_name: string } | null;
}

export interface CreateBookingRequest {
  id?: string;
  client: string;
  service: string;
  date: string;
  time: string;
  notes?: string;
  assignee?: string;
  status?: Booking['status'];
}

export interface UpdateBookingRequest {
  id?: string;
  assignee?: string;
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
    
    const response = await apiClient.get<{ data: BookingApiRecord[] }>(endpoint);
    return response.data.map(toBooking);
  }

  async getById(id: string): Promise<Booking> {
    const response = await apiClient.get<{ data: BookingApiRecord }>(`/bookings/${id}`);
    return toBooking(response.data);
  }

  async create(data: CreateBookingRequest): Promise<Booking> {
    const response = await apiClient.post<{ data: BookingApiRecord }>('/bookings', toBookingPayload(data));
    return toBooking(response.data);
  }

  async update(id: string, data: UpdateBookingRequest): Promise<Booking> {
    const response = await apiClient.put<{ data: BookingApiRecord }>(`/bookings/${id}`, toBookingPayload(data));
    return toBooking(response.data);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/bookings/${id}`);
  }

  async updateStatus(id: string, status: Booking['status']): Promise<Booking> {
    const response = await apiClient.patch<{ data: BookingApiRecord }>(`/bookings/${id}`, { booking_status: status.toLowerCase() });
    return toBooking(response.data);
  }
}

export const bookingsService = new BookingsService();
export default bookingsService;

const toBooking = (booking: BookingApiRecord): Booking => ({
  id: booking.booking_id,
  client: booking.client?.client_name ?? String(booking.client_id),
  service: booking.service?.service_name ?? booking.service?.name ?? String(booking.service_id),
  date: booking.booking_date,
  time: booking.booking_time.slice(0, 5),
  assignee: booking.worker?.worker_name ?? String(booking.assignee ?? ''),
  status: booking.booking_status.toLowerCase() === 'confirmed' ? 'Confirmed' : booking.booking_status.toLowerCase() === 'completed' ? 'Completed' : booking.booking_status.toLowerCase() === 'cancelled' ? 'Canceled' : 'Pending',
  notes: booking.booking_notes ?? '',
});

const toBookingPayload = (booking: CreateBookingRequest | UpdateBookingRequest) => ({
  ...(booking.id !== undefined ? { booking_id: booking.id } : {}),
  ...(booking.client !== undefined ? { client_name: booking.client } : {}),
  ...(booking.service !== undefined ? { service_name: booking.service } : {}),
  ...(booking.assignee !== undefined ? { assignee_name: booking.assignee } : {}),
  ...(booking.date !== undefined ? { booking_date: booking.date } : {}),
  ...(booking.time !== undefined ? { booking_time: booking.time } : {}),
  ...(booking.status !== undefined ? { booking_status: booking.status.toLowerCase() } : {}),
  ...(booking.notes !== undefined ? { booking_notes: booking.notes } : {}),
});

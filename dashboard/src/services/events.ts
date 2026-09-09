/**
 * Events service - handles system events and audit trail.
 */

import { apiClient } from './api';

export interface SystemEvent {
  id: string;
  type: 'create' | 'update' | 'delete' | 'status_change' | 'login' | 'logout' | 'other';
  entity: string;
  entityId: string;
  user: string;
  action: string;
  details: Record<string, unknown>;
  timestamp: string;
  isNew?: boolean;
}

class EventsService {
  async getAll(params?: { search?: string; type?: string; entity?: string; page?: number; limit?: number }): Promise<SystemEvent[]> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.entity) queryParams.append('entity', params.entity);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/events?${queryString}` : '/events';
    
    return apiClient.get<SystemEvent[]>(endpoint);
  }

  async getById(id: string): Promise<SystemEvent> {
    return apiClient.get<SystemEvent>(`/events/${id}`);
  }

  async getRecentEvents(limit: number = 10): Promise<SystemEvent[]> {
    return apiClient.get<SystemEvent[]>(`/events/recent?limit=${limit}`);
  }

  async markAsRead(ids: string[]): Promise<void> {
    await apiClient.post('/events/mark-read', { ids });
  }
}

export const eventsService = new EventsService();
export default eventsService;

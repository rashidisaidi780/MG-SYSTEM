/**
 * Notifications service - handles user notifications and alerts.
 */

import { apiClient } from './api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  user: string;
  actionUrl?: string;
  relatedEntity?: string;
  timestamp: string;
}

export interface CreateNotificationRequest {
  title: string;
  message: string;
  type: Notification['type'];
  user?: string;
  actionUrl?: string;
  relatedEntity?: string;
}

class NotificationsService {
  async getAll(params?: { read?: boolean; type?: string; page?: number; limit?: number }): Promise<Notification[]> {
    const queryParams = new URLSearchParams();
    if (params?.read !== undefined) queryParams.append('read', params.read.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/notifications?${queryString}` : '/notifications';
    
    return apiClient.get<Notification[]>(endpoint);
  }

  async getById(id: string): Promise<Notification> {
    return apiClient.get<Notification>(`/notifications/${id}`);
  }

  async create(data: CreateNotificationRequest): Promise<Notification> {
    return apiClient.post<Notification>('/notifications', data);
  }

  async markAsRead(id: string): Promise<Notification> {
    return apiClient.patch<Notification>(`/notifications/${id}`, { read: true });
  }

  async markAllAsRead(): Promise<void> {
    await apiClient.post('/notifications/mark-all-read', {});
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/notifications/${id}`);
  }

  async deleteAll(): Promise<void> {
    await apiClient.delete('/notifications');
  }

  async getUnreadCount(): Promise<{ count: number }> {
    return apiClient.get<{ count: number }>('/notifications/unread/count');
  }

  subscribeToUpdates(userId: string, callback: (notification: Notification) => void): void {
    // This would typically use WebSocket or Server-Sent Events
    // For now, it's a placeholder for real-time notification subscription
    console.log(`Subscribed to notifications for user: ${userId}`);
  }
}

export const notificationsService = new NotificationsService();
export default notificationsService;

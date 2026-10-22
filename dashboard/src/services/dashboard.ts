import { apiClient } from './api';

export interface DashboardDeadline {
  type: string;
  description: string;
  date: string;
  status: string | null;
  progress: number | null;
}

export interface DashboardSummary {
  invoiceCount: number;
  projectCount: number;
  clientCount: number;
  bookingCount: number;
  officeOrderCount: number;
  deadlines: DashboardDeadline[];
}

class DashboardService {
  async getSummary(): Promise<DashboardSummary> {
    const response = await apiClient.get<{ data: DashboardSummary }>('/dashboard/summary');
    return response.data;
  }
}

export const dashboardService = new DashboardService();

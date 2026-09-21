import { apiClient } from './api';

export interface UpdatePost {
  id: string;
  title: string;
  description: string;
  image: string | null;
  isNew: boolean;
  createdAt: string;
  durationDays: number;
}

interface UpdateApiRecord {
  id: number | string;
  update_id: string;
  update_title: string;
  update_description: string;
  update_image: string | null;
  update_date: string;
  update_duration: number | null;
  update_status: string;
  is_new: boolean;
}

interface UpdateApiResponse {
  data: UpdateApiRecord[];
}

const toUpdate = (record: UpdateApiRecord): UpdatePost => ({
  id: String(record.id),
  title: record.update_title,
  description: record.update_description,
  image: record.update_image,
  isNew: record.is_new,
  createdAt: record.update_date,
  durationDays: record.update_duration ?? 1,
});

class UpdatesService {
  async getAll(): Promise<UpdatePost[]> {
    const response = await apiClient.get<UpdateApiResponse>('/updates');
    return response.data.map(toUpdate);
  }

  async create(data: Omit<UpdatePost, 'id' | 'createdAt'>): Promise<UpdatePost> {
    const response = await apiClient.post<{ data: UpdateApiRecord }>('/updates', {
      update_id: `UPD-${Date.now()}`,
      update_title: data.title,
      update_description: data.description,
      update_image: data.image,
      update_date: new Date().toISOString().slice(0, 10),
      update_duration: data.durationDays,
      is_new: data.isNew,
      update_status: 'active',
    });
    return toUpdate(response.data);
  }

  async update(id: string, data: Pick<UpdatePost, 'isNew'>): Promise<UpdatePost> {
    const response = await apiClient.put<{ data: UpdateApiRecord }>(`/updates/${id}`, {
      is_new: data.isNew,
    });
    return toUpdate(response.data);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/updates/${id}`);
  }
}

export const updatesService = new UpdatesService();
export default updatesService;
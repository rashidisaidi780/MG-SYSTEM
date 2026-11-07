import { apiClient } from './api';

export interface UpdatePost {
  id: string;
  title: string;
  description: string;
  image: string | null;
  link: string | null;
  isNew: boolean;
  createdAt: string;
  durationDays: number;
  expiresAt: string;
  mediaType: 'image' | 'video' | null;
}

interface UpdateApiRecord {
  id: number | string;
  update_id: string;
  update_title: string;
  update_description: string;
  update_image: string | null;
  update_link: string | null;
  update_date: string;
  update_duration: number | null;
  update_status: string;
  is_new: boolean;
  created_at: string;
}

interface UpdateApiResponse {
  data: UpdateApiRecord[];
}

const toUpdate = (record: UpdateApiRecord): UpdatePost => ({
  id: String(record.id),
  title: record.update_title,
  description: record.update_description,
  link: record.update_link,
  image: record.update_image?.startsWith('events/')
    ? `/updates/${record.id}/media`
    : record.update_image,
  mediaType: record.update_image?.startsWith('events/')
    ? 'video'
    : record.update_image
      ? 'image'
      : null,
  isNew: record.is_new,
  createdAt: record.created_at || record.update_date,
  durationDays: record.update_duration ?? 1,
  expiresAt: new Date(new Date(record.created_at || record.update_date).getTime() + (record.update_duration ?? 1) * 86400000).toISOString(),
});

class UpdatesService {
  async getAll(): Promise<UpdatePost[]> {
    const response = await apiClient.get<UpdateApiResponse>('/updates');
    return response.data.map(toUpdate);
  }

  async create(data: Omit<UpdatePost, 'id' | 'createdAt' | 'expiresAt' | 'mediaType'> & { mediaFile?: File | null }): Promise<UpdatePost> {
    const formData = new FormData();
    formData.set('update_id', `UPD-${Date.now()}`);
    formData.set('update_title', data.title);
    formData.set('update_description', data.description);
    formData.set('update_image', data.image || '');
    formData.set('update_link', data.link || '');
    formData.set('update_date', new Date().toISOString().slice(0, 10));
    formData.set('update_duration', String(data.durationDays));
    formData.set('is_new', data.isNew ? '1' : '0');
    formData.set('update_status', 'active');
    if (data.mediaFile) formData.set('media', data.mediaFile);

    const response = await apiClient.postForm<{ data: UpdateApiRecord }>('/updates', formData);
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

  async downloadMedia(id: string): Promise<Blob> {
    return apiClient.download(`/updates/${id}/media?download=1`);
  }

  async getMedia(id: string): Promise<Blob> {
    return apiClient.download(`/updates/${id}/media`);
  }
}

export const updatesService = new UpdatesService();
export default updatesService;
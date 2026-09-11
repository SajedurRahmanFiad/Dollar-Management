import { api } from './api';

export const uploadService = {
  async uploadProof(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('proof', file);
    const res = await api.post<{ data: { url: string } }>('/upload/proof', formData, true);
    return res.data.url;
  },
};

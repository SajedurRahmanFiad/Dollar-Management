import { api } from './api';

export interface UploadResult {
  url: string;
  thumbnailUrl: string;
}

export const uploadService = {
  async uploadProof(file: File, dealId?: string): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('proof', file);
    if (dealId) {
      formData.append('dealId', dealId);
    }
    const res = await api.post<{ data: UploadResult }>('/upload/proof', formData, true);
    return res.data;
  },
};

import { api } from './api';
import { PlatformActivity } from '../types';

export const activityService = {
  async getAll(limit = 20, offset = 0): Promise<PlatformActivity[]> {
    const res = await api.get<{ data: PlatformActivity[] }>(`/activities?limit=${limit}&offset=${offset}`);
    return res.data;
  },
};

import { api } from './api';
import { DollarRequest } from '../types';

export const requestService = {
  async getAll(params?: { status?: string; customerId?: number; search?: string }): Promise<DollarRequest[]> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.customerId) query.set('customerId', String(params.customerId));
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    const res = await api.get<{ data: DollarRequest[] }>(`/requests${qs ? '?' + qs : ''}`);
    return res.data;
  },

  async create(data: {
    customerId?: number;
    customerName: string;
    customerPhone: string;
    requestedUsdAmount: number;
    targetRate?: number;
    notes?: string;
    preferredChannel?: string;
  }): Promise<DollarRequest> {
    const res = await api.post<{ data: DollarRequest }>('/requests', data);
    return res.data;
  },

  async convert(requestId: number, exchangeRate: number): Promise<any> {
    const res = await api.put<{ data: any }>(`/requests/${requestId}/convert`, { exchangeRate });
    return res.data;
  },

  async reject(requestId: number): Promise<void> {
    await api.put(`/requests/${requestId}/reject`);
  },

  async archive(requestId: number): Promise<void> {
    await api.put(`/requests/${requestId}/archive`);
  },
};

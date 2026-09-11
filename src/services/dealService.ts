import { api } from './api';
import { Deal } from '../types';

export const dealService = {
  async getAll(params?: {
    status?: string;
    customerId?: number;
    search?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }): Promise<Deal[]> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.customerId) query.set('customerId', String(params.customerId));
    if (params?.search) query.set('search', params.search);
    if (params?.sort) query.set('sort', params.sort);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    const res = await api.get<{ data: Deal[] }>(`/deals${qs ? '?' + qs : ''}`);
    return res.data;
  },

  async getById(id: number): Promise<Deal> {
    const res = await api.get<{ data: Deal }>(`/deals/${id}`);
    return res.data;
  },

  async create(params: {
    customerId: number;
    dollarAmount: number;
    exchangeRate: number;
    notes?: string;
    linkedRequestId?: number;
  }): Promise<Deal> {
    const res = await api.post<{ data: Deal }>('/deals', {
      customerId: params.customerId,
      dollarAmount: params.dollarAmount,
      exchangeRate: params.exchangeRate,
      notes: params.notes,
      linkedRequestId: params.linkedRequestId,
    });
    return res.data;
  },

  async uploadProof(dealId: number, proofImageUrl?: string, note?: string): Promise<Deal> {
    const res = await api.put<{ data: Deal }>(`/deals/${dealId}/upload-proof`, {
      proofImageUrl,
      note,
    });
    return res.data;
  },

  async confirmReceipt(dealId: number): Promise<Deal> {
    const res = await api.put<{ data: Deal }>(`/deals/${dealId}/confirm-receipt`);
    return res.data;
  },

  async dispute(dealId: number, reason: string): Promise<Deal> {
    const res = await api.put<{ data: Deal }>(`/deals/${dealId}/dispute`, { reason });
    return res.data;
  },

  async cancel(dealId: number, reason: string): Promise<Deal> {
    const res = await api.put<{ data: Deal }>(`/deals/${dealId}/cancel`, { reason });
    return res.data;
  },

  async submitPayment(
    dealId: number,
    amountBdt: number,
    proofImageUrl?: string,
    note?: string
  ): Promise<Deal> {
    const res = await api.post<{ data: Deal }>(`/deals/${dealId}/payments`, {
      amountBdt,
      proofImageUrl,
      note,
    });
    return res.data;
  },

  async approvePayment(dealId: number, eventId: number): Promise<Deal> {
    const res = await api.put<{ data: Deal }>(`/deals/${dealId}/payments/${eventId}/approve`);
    return res.data;
  },

  async declinePayment(dealId: number, eventId: number, reason: string): Promise<Deal> {
    const res = await api.put<{ data: Deal }>(`/deals/${dealId}/payments/${eventId}/decline`, {
      reason,
    });
    return res.data;
  },
};

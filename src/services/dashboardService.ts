import { api } from './api';

export interface DashboardStats {
  totalOutstandingDue: number;
  totalUsdVolume: number;
  totalBdtSettled: number;
  pendingActions: number;
}

export interface DashboardPending {
  pendingPayments: any[];
  pendingRequests: any[];
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const res = await api.get<{ data: DashboardStats }>('/dashboard/stats');
    return res.data;
  },

  async getPending(): Promise<DashboardPending> {
    const res = await api.get<{ data: DashboardPending }>('/dashboard/pending');
    return res.data;
  },
};

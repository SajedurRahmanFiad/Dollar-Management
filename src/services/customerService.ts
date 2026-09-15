import { api } from './api';
import { Customer, CustomerFinancialSummary } from '../types';

export const customerService = {
  async getAll(search?: string, behavior?: string): Promise<Customer[]> {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (behavior) params.set('behavior', behavior);
    const qs = params.toString();
    const res = await api.get<{ data: Customer[] }>(`/customers${qs ? '?' + qs : ''}`);
    return res.data;
  },

  async getById(id: number): Promise<Customer & CustomerFinancialSummary> {
    const res = await api.get<{ data: Customer & CustomerFinancialSummary }>(`/customers/${id}`);
    return res.data;
  },

  async create(data: {
    name: string;
    phone: string;
    companyName?: string;
    notes?: string;
  }): Promise<Customer> {
    const res = await api.post<{ data: Customer }>('/customers', {
      name: data.name,
      phone: data.phone,
      company_name: data.companyName,
      notes: data.notes,
    });
    return res.data;
  },

  async update(id: number, updates: Partial<Customer>): Promise<Customer> {
    const res = await api.put<{ data: Customer }>(`/customers/${id}`, updates);
    return res.data;
  },

  async getSummary(id: number): Promise<CustomerFinancialSummary> {
    const res = await api.get<{ data: CustomerFinancialSummary }>(`/customers/${id}/summary`);
    return res.data;
  },
};

import { api } from './api';

export interface AuthUser {
  id: number;
  role: 'owner' | 'customer';
  username: string;
  phone: string;
  customerId: number | null;
  name: string;
  companyName?: string | null;
}

export interface ProfileUpdates {
  name: string;
  phone: string;
  companyName?: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export const authService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const res = await api.post<{ success: boolean; message: string; data: LoginResponse }>('/auth/login', { username, password });
    api.setToken(res.data.token);
    return res.data;
  },

  async me(): Promise<AuthUser> {
    const res = await api.get<{ success: boolean; data: AuthUser }>('/auth/me');
    return res.data;
  },

  logout() {
    api.setToken(null);
    void api.post('/auth/logout').catch(() => undefined);
  },

  async updatePassword(password: string): Promise<void> {
    await api.put('/auth/password', { password });
  },

  async updateProfile(updates: ProfileUpdates): Promise<AuthUser> {
    const res = await api.put<{ success: boolean; data: AuthUser }>('/auth/profile', updates);
    return res.data;
  },

  getToken(): string | null {
    return api.getToken();
  },
};

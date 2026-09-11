import { api } from './api';

export interface AuthUser {
  id: number;
  role: 'owner' | 'customer';
  username: string;
  customerId: number | null;
  name: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export const authService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const res = await api.post<LoginResponse>('/auth/login', { username, password });
    api.setToken(res.token);
    return res;
  },

  async me(): Promise<AuthUser> {
    const res = await api.get<{ data: AuthUser }>('/auth/me');
    return res.data;
  },

  logout() {
    api.setToken(null);
  },

  getToken(): string | null {
    return api.getToken();
  },
};

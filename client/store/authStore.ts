import { create } from 'zustand';
import api from '@/services/api';
import { User } from '@/types';
import { useWorkspace } from './workspaceStore';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
}

const persist = (token: string, user: User) => {
  try {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  } catch {}
};

const clearSession = () => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch {}
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    useWorkspace.getState().reset();
    persist(data.token, data.user);
    set({ user: data.user, token: data.token });
  },

  register: async (email, password, name) => {
    const { data } = await api.post('/auth/register', { email, password, name });
    useWorkspace.getState().reset();
    persist(data.token, data.user);
    set({ user: data.user, token: data.token });
  },

  logout: () => {
    clearSession();
    useWorkspace.getState().reset();
    set({ user: null, token: null });
  },

  loadUser: async () => {
    if (get().user) {
      set({ isLoading: false });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        set({ isLoading: false });
        return;
      }
      set({ token });
      const stored = localStorage.getItem('user');
      if (stored) set({ user: JSON.parse(stored) });
      const { data } = await api.get('/auth/me');
      localStorage.setItem('user', JSON.stringify(data));
      set({ user: data, isLoading: false });
    } catch {
      clearSession();
      set({ user: null, token: null, isLoading: false });
    }
  },

  updateProfile: async (name) => {
    const { data } = await api.put('/auth/me', { name });
    const token = get().token || '';
    persist(token, data);
    set({ user: data });
  },
}));

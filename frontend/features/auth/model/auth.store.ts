import { create } from 'zustand';
import { User } from '@/shared/types/user';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setAuth: (user: User, token: string) => {
    localStorage.setItem('access_token', token);
    set({ user, isAuthenticated: true });
  },

  clearAuth: () => {
    localStorage.removeItem('access_token');
    set({ user: null, isAuthenticated: false });
  },
}));

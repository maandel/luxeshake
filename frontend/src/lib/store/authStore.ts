import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  role: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string, role: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  role: null,
  isAuthenticated: false,
  setAuth: (token, role) => set({ accessToken: token, role: role, isAuthenticated: true }),
  clearAuth: () => set({ accessToken: null, role: null, isAuthenticated: false }),
}));

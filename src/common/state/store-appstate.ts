import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  setUser: (user: User | null) => void;
  setAuthenticated: (status: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      setUser: (user) => set({ user }),
      setAuthenticated: (status) => set({ isAuthenticated: status }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

interface AppState {
  sidebarOpenOnMobile: boolean;
  setSidebarOpenOnMobile: (open: boolean) => void;
  
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  
  themeMode: 'light' | 'dark' | 'system';
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
}

export const useAppStateStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarOpenOnMobile: false,
      setSidebarOpenOnMobile: (open) => set({ sidebarOpenOnMobile: open }),
      
      showSettings: false,
      setShowSettings: (show) => set({ showSettings: show }),
      
      themeMode: 'system',
      setThemeMode: (mode) => set({ themeMode: mode }),
    }),
    {
      name: 'app-state',
    }
  )
);

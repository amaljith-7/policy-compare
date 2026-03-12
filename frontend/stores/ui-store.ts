import { create } from 'zustand';
import type { User } from '@/lib/types';

interface UIState {
  sidebarOpen: boolean;
  activeModalId: string | null;
  user: User | null;
  isAuthenticated: boolean;

  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setActiveModal: (id: string | null) => void;
  setUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  logout: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeModalId: null,
  user: null,
  isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('access_token') : false,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setActiveModal: (id) => set({ activeModalId: id }),
  setUser: (user) => set({ user }),
  setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, isAuthenticated: false });
  },
}));

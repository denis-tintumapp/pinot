/**
 * Store de Zustand para estado de UI
 * Maneja modales, sidebars, notificaciones, etc.
 */

import { create } from 'zustand';

interface UIState {
  // Modales
  isModalOpen: boolean;
  modalType: string | null;
  modalData: any;
  
  // Sidebars
  isSidebarOpen: boolean;
  sidebarType: string | null;
  
  // Notificaciones
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    duration?: number;
  }>;
  
  // Loading states
  globalLoading: boolean;
  loadingMessage: string | null;
  
  // Acciones
  openModal: (type: string, data?: any) => void;
  closeModal: () => void;
  openSidebar: (type: string) => void;
  closeSidebar: () => void;
  addNotification: (notification: Omit<UIState['notifications'][0], 'id'>) => void;
  removeNotification: (id: string) => void;
  setGlobalLoading: (loading: boolean, message?: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Estado inicial
  isModalOpen: false,
  modalType: null,
  modalData: null,
  isSidebarOpen: false,
  sidebarType: null,
  notifications: [],
  globalLoading: false,
  loadingMessage: null,
  
  // Acciones
  openModal: (type, data) => set({
    isModalOpen: true,
    modalType: type,
    modalData: data,
  }),
  
  closeModal: () => set({
    isModalOpen: false,
    modalType: null,
    modalData: null,
  }),
  
  openSidebar: (type) => set({
    isSidebarOpen: true,
    sidebarType: type,
  }),
  
  closeSidebar: () => set({
    isSidebarOpen: false,
    sidebarType: null,
  }),
  
  addNotification: (notification) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }],
    }));
    
    // Auto-remover después de la duración (default 5 segundos)
    const duration = notification.duration || 5000;
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, duration);
  },
  
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id),
  })),
  
  setGlobalLoading: (loading, message) => set({
    globalLoading: loading,
    loadingMessage: message || null,
  }),
}));


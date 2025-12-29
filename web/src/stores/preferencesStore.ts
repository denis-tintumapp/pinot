/**
 * Store de Zustand para preferencias de usuario
 * Con persistencia en localStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PreferencesState {
  // Tema
  theme: 'light' | 'dark' | 'auto';
  
  // Idioma
  language: string;
  
  // Notificaciones
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  
  // UI Preferences
  sidebarCollapsed: boolean;
  compactMode: boolean;
  
  // Acciones
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setLanguage: (language: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setEmailNotifications: (enabled: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCompactMode: (compact: boolean) => void;
  resetPreferences: () => void;
}

const defaultPreferences: Omit<PreferencesState, 
  'setTheme' | 'setLanguage' | 'setNotificationsEnabled' | 
  'setEmailNotifications' | 'setSidebarCollapsed' | 
  'setCompactMode' | 'resetPreferences'> = {
  theme: 'auto',
  language: 'es',
  notificationsEnabled: true,
  emailNotifications: true,
  sidebarCollapsed: false,
  compactMode: false,
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...defaultPreferences,
      
      // Acciones
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setEmailNotifications: (enabled) => set({ emailNotifications: enabled }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setCompactMode: (compact) => set({ compactMode: compact }),
      resetPreferences: () => set(defaultPreferences),
    }),
    {
      name: 'preferences-storage', // nombre en localStorage
    }
  )
);


/**
 * Hook para manejar la instalación de la PWA
 * Usa el evento beforeinstallprompt capturado en main.tsx
 */

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface UsePWAInstallReturn {
  isInstallable: boolean;
  isInstalled: boolean;
  install: () => Promise<void>;
  showInstallPrompt: boolean;
}

export const usePWAInstall = (): UsePWAInstallReturn => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Verificar si la app ya está instalada
    const checkIfInstalled = () => {
      // En modo standalone (app instalada)
      if (window.matchMedia('(display-mode: standalone)').matches) {
        return true;
      }
      
      // Verificar si está en la pantalla de inicio (iOS)
      if ((window.navigator as any).standalone === true) {
        return true;
      }
      
      return false;
    };

    setIsInstalled(checkIfInstalled());

    // Verificar si hay un prompt disponible
    const checkPrompt = () => {
      if (window.deferredPrompt) {
        setIsInstallable(true);
        setShowInstallPrompt(true);
      }
    };

    // Escuchar el evento personalizado cuando la app se vuelve instalable
    const handleInstallable = () => {
      setIsInstallable(true);
      setShowInstallPrompt(true);
      console.log('[PWA Hook] App es instalable');
    };

    // Escuchar cuando la app se instala
    const handleAppInstalled = () => {
      console.log('[PWA Hook] App instalada');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setIsInstallable(false);
    };

    // Verificar inmediatamente
    checkPrompt();

    // Escuchar eventos
    window.addEventListener('pwa-installable', handleInstallable);
    window.addEventListener('pwa-installed', handleAppInstalled);

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('pwa-installed', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<void> => {
    if (!window.deferredPrompt) {
      console.warn('[PWA Hook] No hay prompt de instalación disponible');
      return;
    }

    try {
      // Mostrar el prompt de instalación
      await window.deferredPrompt.prompt();
      
      // Esperar la respuesta del usuario
      const choiceResult = await window.deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA Hook] Usuario aceptó la instalación');
        setIsInstalled(true);
      } else {
        console.log('[PWA Hook] Usuario rechazó la instalación');
      }
      
      // Limpiar el prompt
      window.deferredPrompt = null;
      setShowInstallPrompt(false);
      setIsInstallable(false);
    } catch (error) {
      console.error('[PWA Hook] Error al instalar:', error);
    }
  };

  return {
    isInstallable,
    isInstalled,
    install,
    showInstallPrompt
  };
};







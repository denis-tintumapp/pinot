/**
 * Componente de botón para instalar la PWA
 * Se muestra cuando la app es instalable
 */

import React from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, install, showInstallPrompt } = usePWAInstall();

  // No mostrar si ya está instalada o no es instalable
  if (isInstalled || !isInstallable || !showInstallPrompt) {
    return null;
  }

  return (
    <button
      onClick={install}
      className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-lg transition-all flex items-center gap-2 text-sm font-medium"
      title="Instalar Pinot como aplicación"
      aria-label="Instalar aplicación"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
      <span className="hidden sm:inline">Instalar App</span>
      <span className="sm:hidden">Instalar</span>
    </button>
  );
};

export default PWAInstallButton;







/**
 * Componente para mostrar overlay de carga global
 */

import React from 'react';
import { useUIStore } from '../../stores/uiStore';

export function LoadingOverlay() {
  const globalLoading = useUIStore((state) => state.globalLoading);
  const loadingMessage = useUIStore((state) => state.loadingMessage);

  if (!globalLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner border-white/30 border-t-white w-12 h-12"></div>
          {loadingMessage && (
            <p className="text-white font-medium">{loadingMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}


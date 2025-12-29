/**
 * Componente para mostrar notificaciones desde el UI Store
 */

import React, { useEffect } from 'react';
import { useUIStore } from '../../stores/uiStore';

export function NotificationContainer() {
  const notifications = useUIStore((state) => state.notifications);
  const removeNotification = useUIStore((state) => state.removeNotification);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => {
        const bgColors = {
          success: 'bg-green-500/90',
          error: 'bg-red-500/90',
          info: 'bg-blue-500/90',
          warning: 'bg-yellow-500/90',
        };

        const textColors = {
          success: 'text-white',
          error: 'text-white',
          info: 'text-white',
          warning: 'text-white',
        };

        return (
          <div
            key={notification.id}
            className={`${bgColors[notification.type]} ${textColors[notification.type]} px-4 py-3 rounded-lg shadow-lg flex items-start gap-3 animate-fade-in`}
          >
            <div className="flex-1">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Cerrar notificación"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}


/**
 * Configuración de Sentry para el frontend
 * Error tracking y monitoring
 */

import * as Sentry from '@sentry/react';
import { getAuth } from 'firebase/auth';
import { getApps } from 'firebase/app';
import { firebaseConfig } from '../../js/core/firebase-config';

interface SentryConfig {
  dsn: string;
  environment: 'development' | 'production';
  enabled: boolean;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
}

/**
 * Inicializar Sentry
 */
export function initSentry(): void {
  try {
    // Obtener DSN desde variable de entorno (Vite usa VITE_ prefix)
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    const environment = import.meta.env.MODE === 'production' ? 'production' : 'development';
    
    // Debug logging
    console.log('[Sentry] Debug - DSN:', dsn ? `${dsn.substring(0, 30)}...` : 'NO CONFIGURADO');
    console.log('[Sentry] Debug - Environment:', environment);
    console.log('[Sentry] Debug - MODE:', import.meta.env.MODE);
    console.log('[Sentry] Debug - VITE_SENTRY_DSN:', import.meta.env.VITE_SENTRY_DSN ? 'EXISTS' : 'NOT FOUND');
    
    // Solo inicializar si hay DSN configurado
    if (!dsn) {
      console.warn('[Sentry] ⚠️ DSN no configurado. Error tracking deshabilitado.');
      console.warn('[Sentry] Verifica que VITE_SENTRY_DSN esté en .env');
      return;
    }

    const config: SentryConfig = {
      dsn,
      environment,
      enabled: true, // Habilitado en desarrollo y producción para testing
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% en prod, 100% en dev
      replaysSessionSampleRate: 0.1, // 10% de sesiones
      replaysOnErrorSampleRate: 1.0, // 100% de errores
    };

    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,
      enabled: config.enabled,
      
      // Integración con React
      integrations: [
        Sentry.replayIntegration({
          // Configuración de Replay
          maskAllText: true, // Enmascarar texto por privacidad
          blockAllMedia: true, // Bloquear media por privacidad
        }),
        Sentry.browserTracingIntegration(),
        // No incluir reactIntegration aquí - se maneja automáticamente con @sentry/react
      ],

      // Performance Monitoring
      tracesSampleRate: config.tracesSampleRate,
      
      // Session Replay
      replaysSessionSampleRate: config.replaysSessionSampleRate,
      replaysOnErrorSampleRate: config.replaysOnErrorSampleRate,

      // Release tracking
      release: `pinot-frontend@${import.meta.env.VITE_APP_VERSION || 'unknown'}`,
      
      // Configuración adicional
      beforeSend(event, hint) {
        // Filtrar errores que no queremos reportar
        if (event.exception) {
          const error = hint.originalException;
          
          // Filtrar errores de red conocidos
          if (error instanceof Error) {
            // Errores de reCAPTCHA (ya tenemos logging específico)
            if (error.message.includes('recaptcha') || error.message.includes('RECAPTCHA')) {
              return null; // No reportar
            }
            
            // Errores de CORS (son esperados en algunos casos)
            if (error.message.includes('CORS') || error.message.includes('cors')) {
              return null; // No reportar
            }
          }
        }
        
        return event;
      },
    });

    console.log('[Sentry] ✅ Inicializado correctamente');
    console.log('[Sentry] Environment:', config.environment);
    console.log('[Sentry] DSN:', config.dsn.substring(0, 20) + '...');

    // Actualizar contexto de usuario cuando Firebase Auth está disponible
    updateUserContext();
  } catch (error) {
    console.error('[Sentry] ❌ Error al inicializar Sentry:', error);
    // No bloquear la aplicación si Sentry falla
  }
}

/**
 * Actualizar contexto de usuario desde Firebase Auth
 */
export async function updateUserContext(): Promise<void> {
  try {
    // Esperar a que Firebase esté inicializado
    if (getApps().length === 0) {
      // Firebase aún no está inicializado, esperar un poco
      setTimeout(updateUserContext, 1000);
      return;
    }

    const auth = getAuth();
    
    // Escuchar cambios en el estado de autenticación
    auth.onAuthStateChanged((user) => {
      if (user) {
        Sentry.setUser({
          id: user.uid,
          email: user.email || undefined,
          username: user.displayName || undefined,
        });
      } else {
        Sentry.setUser(null);
      }
    });
  } catch (error) {
    console.error('[Sentry] Error al actualizar contexto de usuario:', error);
  }
}

/**
 * Agregar contexto adicional (evento, etc.)
 */
export function setEventContext(eventId: string, eventName?: string): void {
  Sentry.setContext('event', {
    id: eventId,
    name: eventName,
  });
}

/**
 * Limpiar contexto de evento
 */
export function clearEventContext(): void {
  Sentry.setContext('event', null);
}

/**
 * Capturar excepción manualmente
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Capturar mensaje manualmente
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  Sentry.captureMessage(message, level);
}

/**
 * Agregar breadcrumb
 */
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
  Sentry.addBreadcrumb(breadcrumb);
}

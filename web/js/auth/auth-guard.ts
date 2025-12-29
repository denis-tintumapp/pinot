/**
 * Auth Guard - Protección de rutas y componentes
 * Verifica autenticación antes de permitir acceso
 */

import { onAuthStateChange, estaAutenticado, getUsuarioActualAuth } from './auth.js';
import type { AuthUser } from './auth.js';

/**
 * Verificar si el usuario está autenticado
 * Redirige a login si no está autenticado
 */
export async function requireAuth(): Promise<AuthUser | null> {
  return new Promise((resolve) => {
    if (estaAutenticado()) {
      const user = getUsuarioActualAuth();
      resolve(user);
      return;
    }

    // Si no está autenticado, redirigir a login
    const currentPath = window.location.pathname;
    const loginPath = '/auth/login';
    
    // Solo redirigir si no estamos ya en login
    if (!currentPath.includes('login') && !currentPath.includes('signup')) {
      window.location.href = `${loginPath}?redirect=${encodeURIComponent(currentPath)}`;
    }

    resolve(null);
  });
}

/**
 * Verificar autenticación y ejecutar callback
 */
export function withAuth(callback: (user: AuthUser) => void | Promise<void>): void {
  onAuthStateChange((user) => {
    if (user) {
      callback(user);
    } else {
      // Usuario no autenticado, redirigir a login
      const currentPath = window.location.pathname;
      if (!currentPath.includes('login') && !currentPath.includes('signup')) {
        window.location.href = `/?redirect=${encodeURIComponent(currentPath)}`;
      }
    }
  });
}

/**
 * Verificar si el email está verificado
 */
export function requireEmailVerificado(): boolean {
  const user = getUsuarioActualAuth();
  if (!user) return false;
  
  if (!user.emailVerified) {
    // Redirigir a página de verificación
    window.location.href = '/auth/verify';
    return false;
  }
  
  return true;
}

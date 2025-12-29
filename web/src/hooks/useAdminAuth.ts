/**
 * Hook para autenticación del panel de administración
 * Optimizado para verificar solo una vez al inicio y cachear el estado
 */

import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, getFirestore } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '../../js/core/firebase-config.ts';
import { useAdminAuthStore } from '../stores/adminAuthStore';

const ADMIN_PASSWORD_HASH = '7bf7c752cb6584691a81d44f29ea5b3bbe9f5b8dc7f81e9347388edc3d03a46f'; // "PinotAdmin" en SHA-256

// Cache global para el estado de autenticación (compartido entre componentes)
let authCache: {
  isAuthenticated: boolean | null;
  loading: boolean;
  verified: boolean;
} = {
  isAuthenticated: null,
  loading: true,
  verified: false
};

export const useAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(authCache.isAuthenticated ?? false);
  const [loading, setLoading] = useState(authCache.loading);
  const hasVerifiedRef = useRef(false);

  const { authToken, setAuthToken, clearAuth } = useAdminAuthStore();

  useEffect(() => {
    // Solo verificar una vez si ya hay un token en el store
    // Si no hay token, no hacer llamadas a Firestore
    if (!authToken) {
      // Sin token, no autenticado inmediatamente
      setIsAuthenticated(false);
      setLoading(false);
      authCache.isAuthenticated = false;
      authCache.loading = false;
      authCache.verified = true;
      return;
    }

    // Si ya hay un token y ya verificamos antes, usar el cache
    if (authCache.verified && authCache.isAuthenticated !== null) {
      setIsAuthenticated(authCache.isAuthenticated);
      setLoading(false);
      return;
    }

    // Solo verificar contra Firestore si es la primera vez y hay token
    if (!hasVerifiedRef.current && authToken) {
      hasVerifiedRef.current = true;
      verificarAutenticacion(authToken);
    } else {
      // Si hay token pero aún no verificamos, asumir autenticado temporalmente
      setIsAuthenticated(true);
      setLoading(false);
    }
  }, [authToken]);

  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const obtenerPasswordHash = async (): Promise<string> => {
    try {
      let app;
      if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
      } else {
        app = getApps()[0];
      }

      if (!app) {
        throw new Error('No se pudo inicializar Firebase');
      }

      const db = getFirestore(app);
      const configRef = doc(db, 'admin_config', 'password');
      const configSnap = await getDoc(configRef);

      if (configSnap.exists()) {
        const data = configSnap.data();
        if (data.passwordHash && typeof data.passwordHash === 'string' && data.passwordHash.length === 64) {
          return data.passwordHash;
        }
      }

      return ADMIN_PASSWORD_HASH;
    } catch (error) {
      console.error('[useAdminAuth] Error al obtener password hash:', error);
      return ADMIN_PASSWORD_HASH;
    }
  };

  const verificarAutenticacion = async (authToken: string) => {
    try {
      const currentHash = await obtenerPasswordHash();
      const isValid = authToken === currentHash;
      
      setIsAuthenticated(isValid);
      authCache.isAuthenticated = isValid;
      authCache.verified = true;
      
      if (!isValid) {
        clearAuth();
      }
    } catch (error) {
      console.error('[useAdminAuth] Error al verificar autenticación:', error);
      setIsAuthenticated(false);
      authCache.isAuthenticated = false;
      authCache.verified = true;
    } finally {
      setLoading(false);
      authCache.loading = false;
    }
  };

  const login = async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const hashedPassword = await hashPassword(password);
      const currentHash = await obtenerPasswordHash();

      if (hashedPassword === currentHash) {
        setAuthToken(hashedPassword);
        setIsAuthenticated(true);
        // Actualizar cache
        authCache.isAuthenticated = true;
        authCache.verified = true;
        authCache.loading = false;
        return { success: true };
      } else {
        return { success: false, error: 'Contraseña incorrecta' };
      }
    } catch (error: any) {
      console.error('[useAdminAuth] Error al hacer login:', error);
      return { success: false, error: error.message || 'Error al procesar el login' };
    }
  };

  const logout = () => {
    clearAuth();
    setIsAuthenticated(false);
    // Limpiar cache
    authCache.isAuthenticated = false;
    authCache.verified = false;
    authCache.loading = false;
  };

  const cambiarPassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (newPassword.length < 6) {
        return { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres' };
      }

      const currentHash = await hashPassword(currentPassword);
      const storedHash = await obtenerPasswordHash();

      if (currentHash !== storedHash) {
        return { success: false, error: 'La contraseña actual es incorrecta' };
      }

      const nuevoHash = await hashPassword(newPassword);
      let app;
      if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
      } else {
        app = getApps()[0];
      }

      if (!app) {
        throw new Error('No se pudo inicializar Firebase');
      }

      const db = getFirestore(app);
      const configRef = doc(db, 'admin_config', 'password');
      await setDoc(configRef, {
        passwordHash: nuevoHash
      }, { merge: true });

      setAuthToken(nuevoHash);
      // Actualizar cache
      authCache.isAuthenticated = true;
      authCache.verified = true;
      setIsAuthenticated(true);
      return { success: true };
    } catch (error: any) {
      console.error('[useAdminAuth] Error al cambiar password:', error);
      return { success: false, error: error.message || 'Error al actualizar la contraseña' };
    }
  };

  return {
    isAuthenticated,
    loading,
    login,
    logout,
    cambiarPassword
  };
};












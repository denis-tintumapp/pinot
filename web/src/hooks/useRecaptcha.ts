/**
 * Hook reutilizable para manejar reCAPTCHA v3
 * Encapsula la lógica de carga y ejecución de reCAPTCHA para uso en múltiples componentes
 * 
 * ⚠️ TEMPORALMENTE DESACTIVADO: reCAPTCHA está deshabilitado por el momento
 * Para reactivarlo, cambia RECAPTCHA_ENABLED a true
 */

import { useState, useEffect, useCallback } from 'react';
import { RECAPTCHA_SITE_KEY } from '../../js/core/firebase-config';

// Flag para habilitar/deshabilitar reCAPTCHA
const RECAPTCHA_ENABLED = false;

// Declarar tipo global para grecaptcha
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

interface UseRecaptchaReturn {
  /** Indica si reCAPTCHA está listo para usar */
  ready: boolean;
  /** Ejecuta reCAPTCHA con una acción específica y retorna el token */
  executeRecaptcha: (action: string) => Promise<string | undefined>;
  /** Indica si hubo un error al cargar reCAPTCHA */
  error: string | null;
}

/**
 * Hook para manejar reCAPTCHA v3
 * 
 * @param autoExecute - Si es true, ejecuta reCAPTCHA automáticamente al cargar con acción 'page_load'
 * @returns Objeto con estado y funciones para interactuar con reCAPTCHA
 * 
 * @example
 * ```tsx
 * const { ready, executeRecaptcha } = useRecaptcha();
 * 
 * const handleSubmit = async () => {
 *   const token = await executeRecaptcha('signup');
 *   // Usar token en la petición
 * };
 * ```
 */
export function useRecaptcha(autoExecute: boolean = true): UseRecaptchaReturn {
  const [ready, setReady] = useState(RECAPTCHA_ENABLED ? false : true); // Listo inmediatamente si está deshabilitado
  const [error, setError] = useState<string | null>(null);

  // Si reCAPTCHA está deshabilitado, retornar funciones mock
  if (!RECAPTCHA_ENABLED) {
    const executeRecaptchaMock = useCallback(async (action: string): Promise<string | undefined> => {
      console.log('[useRecaptcha] ⚠️  reCAPTCHA está deshabilitado temporalmente. Retornando token mock.');
      return undefined; // Retornar undefined para que el backend sepa que no hay token
    }, []);

    return {
      ready: true,
      executeRecaptcha: executeRecaptchaMock,
      error: null
    };
  }

  // Función para ejecutar reCAPTCHA inicialmente (page_load)
  const executeInitialRecaptcha = useCallback(async () => {
    if (!window.grecaptcha) return;
    
    try {
      await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, {
        action: 'page_load'
      });
      console.log('[useRecaptcha] Token generado automáticamente para completar configuración');
    } catch (error) {
      console.warn('[useRecaptcha] Error al ejecutar automáticamente:', error);
    }
  }, []);

  // Cargar reCAPTCHA cuando se monte el componente (solo si está habilitado)
  useEffect(() => {
    if (!RECAPTCHA_ENABLED) {
      return; // No cargar nada si está deshabilitado
    }
    // Verificar si el script ya está cargado
    if (window.grecaptcha) {
      window.grecaptcha.ready(() => {
        setReady(true);
        console.log('[useRecaptcha] reCAPTCHA v3 ya estaba cargado');
        
        // Ejecutar automáticamente si está configurado
        if (autoExecute) {
          executeInitialRecaptcha();
        }
      });
      return;
    }

    // Verificar si el script ya está en el DOM pero aún no está disponible
    const existingScript = document.querySelector(
      `script[src*="recaptcha/api.js"]`
    ) as HTMLScriptElement;

    if (existingScript) {
      // El script está cargándose, esperar a que esté listo
      let attempts = 0;
      const maxAttempts = 50; // 5 segundos máximo

      const checkRecaptcha = () => {
        attempts++;
        
        if (window.grecaptcha && typeof window.grecaptcha.ready === 'function') {
          window.grecaptcha.ready(() => {
            setReady(true);
            console.log('[useRecaptcha] reCAPTCHA v3 listo (script existente)');
            
            if (autoExecute) {
              executeInitialRecaptcha();
            }
          });
        } else if (attempts < maxAttempts) {
          setTimeout(checkRecaptcha, 100);
        } else {
          console.warn('[useRecaptcha] Timeout esperando reCAPTCHA existente');
          setError('Timeout esperando reCAPTCHA');
        }
      };

      // Esperar un poco antes de empezar a verificar
      setTimeout(checkRecaptcha, 100);
      return;
    }

    // Cargar el script dinámicamente
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}&badge=bottomright`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      let attempts = 0;
      const maxAttempts = 50; // 5 segundos máximo (50 * 100ms)
      
      const checkRecaptcha = () => {
        attempts++;
        
        if (window.grecaptcha && typeof window.grecaptcha.ready === 'function' && typeof window.grecaptcha.execute === 'function') {
          window.grecaptcha.ready(async () => {
            setReady(true);
            setError(null);
            console.log('[useRecaptcha] reCAPTCHA v3 listo');
            
            // Ejecutar automáticamente al cargar para generar tokens y completar configuración
            if (autoExecute) {
              executeInitialRecaptcha();
            }
          });
        } else if (attempts < maxAttempts) {
          // Reintentar después de un breve delay
          setTimeout(checkRecaptcha, 100);
        } else {
          console.warn('[useRecaptcha] Timeout: reCAPTCHA no se cargó después de 5 segundos. Continuando sin reCAPTCHA.');
          setError('Timeout cargando reCAPTCHA');
          // Continuar sin reCAPTCHA - no es crítico
        }
      };
      
      checkRecaptcha();
    };

    script.onerror = (error) => {
      const currentDomain = window.location.hostname;
      console.error('[useRecaptcha] ❌ Error al cargar el script de reCAPTCHA');
      console.error('[useRecaptcha] Dominio actual:', currentDomain);
      console.error('[useRecaptcha] Site Key:', RECAPTCHA_SITE_KEY);
      console.error('[useRecaptcha] Error:', error);
      console.error('[useRecaptcha] Verifica en:', `https://console.cloud.google.com/security/recaptcha/${RECAPTCHA_SITE_KEY}/overview?project=pinot-tintum`);
      setError('Error cargando script de reCAPTCHA');
    };

    document.head.appendChild(script);

    // No removemos el script al desmontar para evitar recargas innecesarias
    // El script puede quedarse en el DOM sin problemas
  }, [autoExecute, executeInitialRecaptcha]);

  // Función para ejecutar reCAPTCHA con una acción específica
  const executeRecaptcha = useCallback(async (action: string): Promise<string | undefined> => {
    if (!ready || !window.grecaptcha) {
      console.warn('[useRecaptcha] ⚠️  reCAPTCHA no está listo o no está disponible');
      console.warn('[useRecaptcha]    ready:', ready);
      console.warn('[useRecaptcha]    grecaptcha disponible:', !!window.grecaptcha);
      return undefined;
    }

    try {
      // Verificar que grecaptcha.execute esté disponible
      if (typeof window.grecaptcha.execute !== 'function') {
        console.warn('[useRecaptcha] ⚠️  grecaptcha.execute no está disponible');
        console.warn('[useRecaptcha]    Tipo de grecaptcha:', typeof window.grecaptcha);
        console.warn('[useRecaptcha]    Propiedades disponibles:', Object.keys(window.grecaptcha || {}));
        return undefined;
      }

      // Información de diagnóstico antes de ejecutar
      const currentDomain = window.location.hostname;
      const currentUrl = window.location.href;
      console.log(`[useRecaptcha] 🔵 Ejecutando reCAPTCHA...`);
      console.log(`[useRecaptcha]    - Acción: ${action}`);
      console.log(`[useRecaptcha]    - Site Key: ${RECAPTCHA_SITE_KEY}`);
      console.log(`[useRecaptcha]    - Dominio: ${currentDomain}`);
      console.log(`[useRecaptcha]    - URL completa: ${currentUrl}`);
      
      // Interceptar errores de red antes de ejecutar
      const originalFetch = window.fetch;
      let networkError: any = null;
      
      // Interceptar fetch para capturar errores 401
      window.fetch = async (...args) => {
        try {
          const response = await originalFetch(...args);
          if (args[0] && typeof args[0] === 'string' && args[0].includes('recaptcha/api2/pat')) {
            if (response.status === 401) {
              networkError = {
                type: 'fetch_401',
                url: args[0],
                status: response.status,
                statusText: response.statusText
              };
              console.error('[useRecaptcha] 🔴 Error 401 detectado en fetch de reCAPTCHA');
              console.error('[useRecaptcha]    URL:', args[0]);
              console.error('[useRecaptcha]    Status:', response.status);
            }
          }
          return response;
        } catch (err) {
          if (args[0] && typeof args[0] === 'string' && args[0].includes('recaptcha')) {
            networkError = {
              type: 'fetch_error',
              url: args[0],
              error: err
            };
          }
          throw err;
        }
      };
      
      try {
        const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, {
          action: action
        });
        
        // Restaurar fetch original
        window.fetch = originalFetch;
        
        console.log(`[useRecaptcha] ✅ Token obtenido exitosamente para acción: ${action}`);
        console.log(`[useRecaptcha]    Token (primeros 20 chars): ${token.substring(0, 20)}...`);
        return token;
      } catch (execError) {
        // Restaurar fetch original
        window.fetch = originalFetch;
        
        // Si hay un error de red capturado, lanzarlo
        if (networkError) {
          throw networkError;
        }
        throw execError;
      }
    } catch (recaptchaError: any) {
      // Diagnóstico detallado del error
      const errorMessage = recaptchaError?.message || String(recaptchaError || '');
      const errorString = String(recaptchaError || '');
      const errorObject = recaptchaError?.error || recaptchaError;
      
      // Información de diagnóstico
      const currentDomain = window.location.hostname;
      const currentProtocol = window.location.protocol;
      const currentUrl = window.location.href;
      
      console.error('[useRecaptcha] ❌ Error al ejecutar reCAPTCHA');
      console.error('[useRecaptcha] ════════════════════════════════════════════════════');
      console.error('[useRecaptcha] 📋 DIAGNÓSTICO DETALLADO:');
      console.error('[useRecaptcha]');
      console.error('[useRecaptcha] Site Key usado:', RECAPTCHA_SITE_KEY);
      console.error('[useRecaptcha] Dominio actual:', currentDomain);
      console.error('[useRecaptcha] Protocolo:', currentProtocol);
      console.error('[useRecaptcha] URL completa:', currentUrl);
      console.error('[useRecaptcha] Acción:', action);
      console.error('[useRecaptcha]');
      console.error('[useRecaptcha] Error completo:', recaptchaError);
      console.error('[useRecaptcha] Mensaje de error:', errorMessage);
      console.error('[useRecaptcha] Error como string:', errorString);
      if (errorObject) {
        console.error('[useRecaptcha] Objeto de error:', errorObject);
      }
      console.error('[useRecaptcha]');
      
      // Verificar si es error 401 (múltiples formas)
      const is401 = errorMessage.includes('401') || 
                    errorString.includes('401') || 
                    errorMessage.includes('Unauthorized') ||
                    errorString.includes('Unauthorized') ||
                    (recaptchaError?.status === 401) ||
                    (recaptchaError?.response?.status === 401) ||
                    (recaptchaError?.type === 'fetch_401') ||
                    (errorString.includes('api2/pat') && errorString.includes('401'));
      
      if (is401) {
        console.error('[useRecaptcha] 🔴 ERROR 401 DETECTADO: Site Key inválido o dominio no autorizado');
        console.error('[useRecaptcha]');
        console.error('[useRecaptcha] 🔍 VERIFICACIONES NECESARIAS:');
        console.error('[useRecaptcha]');
        console.error('[useRecaptcha] 1. Verifica que el dominio esté agregado en Google Cloud Console:');
        console.error('[useRecaptcha]    URL:', `https://console.cloud.google.com/security/recaptcha/${RECAPTCHA_SITE_KEY}/overview?project=pinot-tintum`);
        console.error('[useRecaptcha]');
        console.error('[useRecaptcha] 2. Verifica que el dominio exacto coincida:');
        console.error('[useRecaptcha]    - Dominio actual:', currentDomain);
        console.error('[useRecaptcha]    - Debe estar agregado:', currentDomain);
        console.error('[useRecaptcha]    - También verifica:', 'pinot-tintum.web.app');
        console.error('[useRecaptcha]');
        console.error('[useRecaptcha] 3. Verifica el tipo de reCAPTCHA:');
        console.error('[useRecaptcha]    - Debe ser reCAPTCHA v3 (no v2)');
        console.error('[useRecaptcha]    - Site Key v3 comienza con: 6Len... o 6Le...');
        console.error('[useRecaptcha]');
        console.error('[useRecaptcha] 4. Si el dominio YA está agregado pero sigue fallando:');
        console.error('[useRecaptcha]    - Espera 5-10 minutos para propagación');
        console.error('[useRecaptcha]    - Limpia caché del navegador (Ctrl+Shift+R)');
        console.error('[useRecaptcha]    - Prueba en modo incógnito');
        console.error('[useRecaptcha]    - Verifica que no haya espacios o caracteres especiales');
        console.error('[useRecaptcha]');
        console.error('[useRecaptcha] 5. Verifica el Site Key en la consola:');
        console.error('[useRecaptcha]    - Site Key en código:', RECAPTCHA_SITE_KEY);
        console.error('[useRecaptcha]    - Compara con el Site Key en GCP Console');
        console.error('[useRecaptcha] ════════════════════════════════════════════════════');
        setError(`Error 401: Dominio "${currentDomain}" no autorizado para Site Key ${RECAPTCHA_SITE_KEY.substring(0, 10)}...`);
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
        console.warn('[useRecaptcha] ⚠️  Error de red al obtener token de reCAPTCHA');
        console.warn('[useRecaptcha]    Verifica tu conexión a internet');
        setError('Error de red');
      } else {
        console.error('[useRecaptcha] ⚠️  Error desconocido al obtener token');
        console.error('[useRecaptcha]    Tipo:', typeof recaptchaError);
        console.error('[useRecaptcha]    Mensaje:', errorMessage);
        setError(errorMessage || 'Error al obtener token de reCAPTCHA');
      }
      
      // Retornar undefined en lugar de lanzar error (graceful degradation)
      return undefined;
    }
  }, [ready]);

  return {
    ready,
    executeRecaptcha,
    error
  };
}







/**
 * Punto de entrada principal de la aplicación React
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryProvider } from './lib/query-client';
import App from './App';
import './index.css';

// Inicializar Sentry ANTES que cualquier otra cosa
// Comentar temporalmente para debuggear el problema de React hooks
// import { initSentry } from './lib/sentry';
// initSentry();

// Tipo para el evento beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Variable global para almacenar el evento de instalación
declare global {
  interface Window {
    deferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

// Registrar Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const { registerServiceWorker } = await import('../js/sw-register.js');
      const registration = await registerServiceWorker();
      
      if (registration) {
        console.log('[PWA] ✅ Service Worker registrado correctamente');
        console.log('[PWA] Scope:', registration.scope);
        
        // Verificar que el Service Worker esté activo antes de considerar la app instalable
        if (registration.active) {
          console.log('[PWA] ✅ Service Worker activo');
        } else if (registration.installing) {
          console.log('[PWA] ⏳ Service Worker instalándose...');
          registration.installing.addEventListener('statechange', () => {
            if (registration.installing?.state === 'activated') {
              console.log('[PWA] ✅ Service Worker activado');
            }
          });
        } else if (registration.waiting) {
          console.log('[PWA] ⏳ Service Worker esperando activación...');
        }
        
        // Verificar criterios de instalación
        setTimeout(() => {
          checkPWAInstallability();
        }, 2000);
      } else {
        console.warn('[PWA] ⚠️  Service Worker no se pudo registrar');
      }
    } catch (error) {
      console.error('[PWA] ❌ Error al registrar Service Worker:', error);
    }
  });
}

// Función para verificar criterios de instalación de PWA
function checkPWAInstallability() {
  console.log('[PWA] 🔍 Verificando criterios de instalación...');
  
  // Verificar Service Worker
  navigator.serviceWorker.getRegistration().then(registration => {
    if (registration) {
      console.log('[PWA] ✅ Service Worker registrado');
      if (registration.active) {
        console.log('[PWA] ✅ Service Worker activo');
      } else {
        console.warn('[PWA] ⚠️  Service Worker no está activo');
      }
    } else {
      console.warn('[PWA] ⚠️  No hay Service Worker registrado');
    }
  });
  
  // Verificar manifest
  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (manifestLink) {
    console.log('[PWA] ✅ Manifest link encontrado:', manifestLink.getAttribute('href'));
    fetch(manifestLink.getAttribute('href') || '/manifest.json')
      .then(res => res.json())
      .then(manifest => {
        console.log('[PWA] ✅ Manifest válido');
        console.log('[PWA]   - Name:', manifest.name);
        console.log('[PWA]   - Short name:', manifest.short_name);
        console.log('[PWA]   - Icons:', manifest.icons?.length || 0, 'íconos');
        console.log('[PWA]   - Display:', manifest.display);
        console.log('[PWA]   - Start URL:', manifest.start_url);
        
        // Verificar íconos
        if (manifest.icons && manifest.icons.length > 0) {
          const has192 = manifest.icons.some((icon: any) => icon.sizes?.includes('192'));
          const has512 = manifest.icons.some((icon: any) => icon.sizes?.includes('512'));
          console.log('[PWA]   - Ícono 192x192:', has192 ? '✅' : '❌');
          console.log('[PWA]   - Ícono 512x512:', has512 ? '✅' : '❌');
        }
      })
      .catch(err => {
        console.error('[PWA] ❌ Error al cargar manifest:', err);
      });
  } else {
    console.warn('[PWA] ⚠️  No se encontró link al manifest');
  }
  
  // Verificar HTTPS
  if (location.protocol === 'https:') {
    console.log('[PWA] ✅ HTTPS activo');
  } else {
    console.warn('[PWA] ⚠️  No está en HTTPS (requerido para PWA)');
  }
  
  // Verificar beforeinstallprompt
  if (window.deferredPrompt) {
    console.log('[PWA] ✅ beforeinstallprompt capturado - App es instalable');
  } else {
    console.log('[PWA] ℹ️  beforeinstallprompt aún no se ha disparado (puede tardar unos segundos)');
  }
}

// Interceptar errores de red de reCAPTCHA globalmente
if (typeof window !== 'undefined') {
  // Interceptar errores de fetch de reCAPTCHA antes de que se ejecuten
  const originalFetch = window.fetch;
  window.fetch = async function(...args: any[]) {
    const url = args[0];
    // Interceptor para diagnóstico de reCAPTCHA (activo pero reCAPTCHA está deshabilitado temporalmente)
    const isRecaptchaRequest = typeof url === 'string' && url.includes('recaptcha/api2/pat');
    
    try {
      const response = await originalFetch.apply(this, args);
      
      if (isRecaptchaRequest && response.status === 401) {
        const currentDomain = window.location.hostname;
        const siteKeyFromUrl = url.match(/k=([^&]+)/)?.[1];
        const expectedSiteKey = '6LenATMsAAAAAAnM0OI4DcHN_882ML86OOCNRZHX';
        
        console.error('');
        console.error('═══════════════════════════════════════════════════════════════');
        console.error('🔴 ERROR 401 DE reCAPTCHA DETECTADO');
        console.error('═══════════════════════════════════════════════════════════════');
        console.error('');
        console.error('📋 INFORMACIÓN DEL ERROR:');
        console.error('');
        console.error('   URL del request:', url);
        console.error('   Status:', response.status);
        console.error('   Status Text:', response.statusText);
        console.error('   Dominio actual:', currentDomain);
        console.error('   Site Key en URL:', siteKeyFromUrl);
        console.error('   Site Key esperado:', expectedSiteKey);
        console.error('   Site Keys coinciden:', siteKeyFromUrl === expectedSiteKey ? '✅ SÍ' : '❌ NO');
        console.error('');
        console.error('🔍 DIAGNÓSTICO:');
        console.error('');
        console.error('   El dominio "' + currentDomain + '" NO está autorizado para este Site Key');
        console.error('   o el Site Key no coincide con el configurado en Google Cloud Console.');
        console.error('');
        console.error('🔧 SOLUCIÓN:');
        console.error('');
        console.error('   1. Ve a Google Cloud Console:');
        console.error('      https://console.cloud.google.com/security/recaptcha/' + expectedSiteKey + '/overview?project=pinot-tintum');
        console.error('');
        console.error('   2. Verifica que el dominio esté agregado EXACTAMENTE como:');
        console.error('      ' + currentDomain);
        console.error('');
        console.error('   3. Verifica que NO tenga:');
        console.error('      - Espacios antes o después');
        console.error('      - http:// o https://');
        console.error('      - Barras / al final');
        console.error('      - www. (a menos que también uses www)');
        console.error('');
        console.error('   4. Si el dominio YA está agregado pero sigue fallando:');
        console.error('      ⏳ PROPAGACIÓN: Espera 15-30 minutos (los cambios pueden tardar)');
        console.error('      🧹 CACHÉ: Limpia caché completamente:');
        console.error('         - DevTools (F12) → Network → "Disable cache"');
        console.error('         - O Ctrl+Shift+Delete → "Cached images and files"');
        console.error('         - O usa modo incógnito');
        console.error('      🔍 VERIFICACIÓN:');
        console.error('         - Verifica que el dominio NO tenga espacios');
        console.error('         - Verifica que el dominio NO tenga http:// o https://');
        console.error('         - Verifica que el dominio NO tenga / al final');
        console.error('         - Verifica que el Site Key en GCP sea:', expectedSiteKey);
        console.error('         - Verifica que el tipo sea "Website • Score" (v3)');
        console.error('');
        console.error('═══════════════════════════════════════════════════════════════');
        console.error('');
      }
      
      return response;
    } catch (err) {
      if (isRecaptchaRequest) {
        const currentDomain = window.location.hostname;
        console.error('[Global] ❌ Error de red al hacer fetch de reCAPTCHA');
        console.error('[Global]    Dominio:', currentDomain);
        console.error('[Global]    Error:', err);
      }
      throw err;
    }
  };
  
  // Interceptar errores globales de JavaScript relacionados con reCAPTCHA
  window.addEventListener('error', (event) => {
    const errorMessage = event.message || '';
    if (errorMessage.includes('recaptcha') && (errorMessage.includes('401') || errorMessage.includes('Unauthorized'))) {
      const currentDomain = window.location.hostname;
      console.error('[Global] 🔴 Error 401 de reCAPTCHA detectado en error handler global');
      console.error('[Global]    Dominio:', currentDomain);
      console.error('[Global]    Mensaje:', errorMessage);
      console.error('[Global]    Archivo:', event.filename);
      console.error('[Global]    Línea:', event.lineno);
      console.error('[Global]    Verifica en:', 'https://console.cloud.google.com/security/recaptcha/6LenATMsAAAAAAnM0OI4DcHN_882ML86OOCNRZHX/overview?project=pinot-tintum');
    }
  }, true);
}

// Manejar el evento beforeinstallprompt para PWA
window.addEventListener('beforeinstallprompt', (e: Event) => {
  // Prevenir que el navegador muestre el prompt automáticamente
  e.preventDefault();
  
  // Guardar el evento para usarlo después
  window.deferredPrompt = e as BeforeInstallPromptEvent;
  
  console.log('[PWA] Evento beforeinstallprompt capturado - La app es instalable');
  
  // Disparar evento personalizado para que los componentes puedan reaccionar
  window.dispatchEvent(new CustomEvent('pwa-installable'));
});

// Manejar cuando la app se instala
window.addEventListener('appinstalled', () => {
  console.log('[PWA] App instalada exitosamente');
  window.deferredPrompt = null;
  
  // Disparar evento personalizado
  window.dispatchEvent(new CustomEvent('pwa-installed'));
});

// Renderizar aplicación
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('No se encontró el elemento #root');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryProvider>
        <App />
      </QueryProvider>
    </BrowserRouter>
  </React.StrictMode>
);












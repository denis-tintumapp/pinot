/**
 * Módulo centralizado para inicialización de Firebase
 * 
 * Proporciona inicialización única de Firebase App y Firestore,
 * con soporte automático para Firebase Emulators en desarrollo local.
 * 
 * Uso:
 *   import { db } from './core/firebase-init';
 *   // o si necesitas app también:
 *   import { app, db } from './core/firebase-init';
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { firebaseConfig } from './firebase-config';

// Detectar si estamos en desarrollo local
const isDevelopment = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || 
   window.location.hostname === '127.0.0.1');

// Detectar si debemos usar emulators (opcional, mediante parámetro de URL)
// Ejemplo: http://localhost:3000/?useEmulators=true
const useEmulators = isDevelopment && 
  typeof window !== 'undefined' && 
  new URLSearchParams(window.location.search).get('useEmulators') === 'true';

// Inicializar Firebase App (solo una vez)
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Inicializar Firestore
const db = getFirestore(app);

// Conectar a emulators SOLO si está explícitamente habilitado
// Para usar emulators, añade ?useEmulators=true a la URL
// Ejemplo: http://localhost:3000/?useEmulators=true
if (useEmulators) {
  // Conectar Auth Emulator
  try {
    const auth = getAuth(app);
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    console.log('[Firebase] ✅ Conectado a Auth Emulator (localhost:9099)');
  } catch (error: any) {
    if (!error.message?.includes('already been connected') && !error.message?.includes('has already been called')) {
      console.warn('[Firebase] ⚠️ Error al conectar a Auth Emulator:', error.message || error);
    }
  }

  // Conectar Firestore Emulator inmediatamente después de getFirestore
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('[Firebase] ✅ Conectado a Firestore Emulator (localhost:8080)');
  } catch (error: any) {
    // Si ya está conectado, Firebase lanza un error específico - esto es normal
    if (error.message?.includes('already been connected') || error.message?.includes('has already been called')) {
      // Silenciar este error, es normal si el módulo se importa múltiples veces
    } else {
      console.error('[Firebase] ❌ Error al conectar a Firestore Emulator:', error.message || error);
      console.error('[Firebase] 💡 Asegúrate de que los emulators estén corriendo: firebase emulators:start');
      console.error('[Firebase] 💡 Si los emulators no están corriendo, las operaciones de Firestore fallarán');
    }
  }
} else if (isDevelopment) {
  console.log('[Firebase] ℹ️  Emulators no habilitados. Usando Firebase en producción.');
  console.log('[Firebase] 💡 Para usar emulators, añade ?useEmulators=true a la URL');
}

export { app, db };


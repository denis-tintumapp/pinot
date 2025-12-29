/**
 * Módulo de Autenticación con Firebase Authentication
 * Maneja registro, login, logout y gestión de sesiones
 */

import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  User,
  UserCredential
} from 'firebase/auth';
import { app, db } from '../core/firebase-init';
import { 
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  updateDoc,
  addDoc
} from 'firebase/firestore';

const auth = getAuth(app);

// Re-exportar tipos desde auth-types.ts para compatibilidad
export type { AuthUser, AuthResult, RegisterParams, RegisterResult, LoginParams } from './types/auth-types.ts';

/**
 * Registrar nuevo usuario (anfitrión)
 * @deprecated Usar registerUser de auth-service.ts en su lugar
 * Mantenido por compatibilidad hacia atrás
 */
export async function registrarAnfitrion(
  email: string,
  password: string,
  displayName: string
): Promise<AuthResult> {
  const { registerUser } = await import('./services/auth-service.ts');
  
  return registerUser({
    email,
    password,
    alias: displayName,
    aceptaTerminos: true // Asumir aceptación para compatibilidad
  });
}

/**
 * Iniciar sesión
 * @param email - Email del usuario
 * @param password - Contraseña del usuario
 * @param recaptchaToken - Token de reCAPTCHA v3 (opcional, para validación de seguridad)
 * @deprecated Usar loginUser de auth-service.ts en su lugar
 * Mantenido por compatibilidad hacia atrás
 */
export async function iniciarSesion(
  email: string,
  password: string,
  recaptchaToken?: string
): Promise<AuthResult> {
  const { loginUser } = await import('./services/auth-service.ts');
  
  
  return loginUser({
    email,
    password,
    recaptchaToken
  });
}

/**
 * Cerrar sesión
 */
export async function cerrarSesion(): Promise<{ success: boolean; error?: string }> {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    console.error('[Auth] Error al cerrar sesión:', error);
    return {
      success: false,
      error: error.message || 'Error al cerrar sesión'
    };
  }
}

/**
 * Obtener usuario actual
 */
export function getUsuarioActual(): User | null {
  return auth.currentUser;
}

/**
 * Obtener usuario actual como AuthUser
 */
export function getUsuarioActualAuth(): AuthUser | null {
  const user = auth.currentUser;
  if (!user) return null;

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerified,
    photoURL: user.photoURL
  };
}

/**
 * Suscribirse a cambios de autenticación
 * También actualiza emailVerificado en Firestore cuando el usuario verifica su email
 */
export function onAuthStateChange(
  callback: (user: AuthUser | null) => void
): () => void {
  return onAuthStateChanged(auth, async (user: User | null) => {
    // Validar que el usuario tenga un UID válido antes de procesar
    if (user && user.uid && user.uid.length > 20) {
      // Si el email fue verificado, actualizar Firestore
      if (user.emailVerified) {
        
        try {
          const anfitrionRef = doc(db, 'anfitriones', user.uid);
          const anfitrionSnap = await getDoc(anfitrionRef);
          
          
          if (anfitrionSnap.exists()) {
            const data = anfitrionSnap.data();
            // Solo actualizar si aún no está verificado en Firestore
            if (!data.emailVerificado) {
              
              await updateDoc(anfitrionRef, {
                emailVerificado: true
              });
              
            } else {
              
            }
          } else {
            
          }
        } catch (error) {
          
          console.error('[Auth] Error al actualizar emailVerificado en Firestore:', error);
          // No bloquear el callback si falla la actualización
        }
      }
      
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        photoURL: user.photoURL
      });
    } else {
      callback(null);
    }
  });
}

/**
 * Enviar email de restablecimiento de contraseña
 * @param email - Email del usuario
 * @param recaptchaToken - Token de reCAPTCHA v3 (opcional, para validación de seguridad)
 */
export async function enviarResetPassword(
  email: string,
  recaptchaToken?: string
): Promise<AuthResult> {
  try {
    if (!email) {
      return {
        success: false,
        error: 'Email es requerido'
      };
    }

    // Log reCAPTCHA token si está presente (para debugging)
    if (recaptchaToken) {
      console.log('[Auth] reCAPTCHA token recibido para reset password');
    }

    await sendPasswordResetEmail(auth, email);

    return {
      success: true
    };
  } catch (error: any) {
    console.error('[Auth] Error al enviar reset password:', error);
    
    let errorMessage = 'Error al enviar email de restablecimiento';
    
    if (error.code === 'auth/user-not-found') {
      // Por seguridad, no revelamos si el usuario existe
      errorMessage = 'Si el email existe, recibirás un enlace de restablecimiento';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Reenviar email de verificación
 * @param recaptchaToken - Token de reCAPTCHA v3 (opcional, para validación de seguridad)
 */
export async function reenviarVerificacionEmail(
  recaptchaToken?: string
): Promise<AuthResult> {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return {
        success: false,
        error: 'No hay usuario autenticado'
      };
    }

    if (user.emailVerified) {
      return {
        success: false,
        error: 'El email ya está verificado'
      };
    }

    // Log reCAPTCHA token si está presente (para debugging)
    if (recaptchaToken) {
      console.log('[Auth] reCAPTCHA token recibido para reenviar verificación');
    }

    // Obtener datos del anfitrión desde Firestore para el email personalizado
    const anfitrionRef = doc(db, 'anfitriones', user.uid);
    const anfitrionSnap = await getDoc(anfitrionRef);
    
    let nombreAnfitrion = user.displayName || 'Anfitrión';
    if (anfitrionSnap.exists()) {
      const anfitrionData = anfitrionSnap.data();
      nombreAnfitrion = anfitrionData.nombreAnfitrion || anfitrionData.alias || user.displayName || 'Anfitrión';
    }

    // Usar Cloud Function para enviar email personalizado (igual que en el registro inicial)
    try {
      // Usar el servicio de email actualizado
      const { sendVerificationEmail } = await import('./services/email-service.ts');
      
      await sendVerificationEmail({
        email: user.email!,
        nombre: nombreAnfitrion,
        anfitrionId: user.uid,
        tokenVerificacion: await user.getIdToken()
      });
      
    } catch (emailError: any) {
      console.error('[Auth] Error al enviar email de verificación personalizado:', emailError);
      // Si falla el email personalizado, intentar con el método estándar de Firebase como fallback
      await sendEmailVerification(user);
    }

    return {
      success: true
    };
  } catch (error: any) {
    console.error('[Auth] Error al reenviar verificación:', error);
    return {
      success: false,
      error: error.message || 'Error al reenviar email de verificación'
    };
  }
}

/**
 * Verificar si el usuario está autenticado
 */
export function estaAutenticado(): boolean {
  return auth.currentUser !== null;
}

/**
 * Verificar si el email está verificado
 */
export function emailVerificado(): boolean {
  return auth.currentUser?.emailVerified || false;
}

/**
 * Obtener token ID (útil para Cloud Functions)
 */
export async function obtenerTokenId(): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    return await user.getIdToken();
  } catch (error) {
    console.error('[Auth] Error al obtener token:', error);
    return null;
  }
}

/**
 * Generar contraseña aleatoria de 6 caracteres alfanuméricos
 */
function generarPasswordAleatoria(): string {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 6; i++) {
    password += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return password;
}

/**
 * Verificar si un email ya tiene eventos creados
 */
/**
 * Verificar si un email ya tiene eventos creados
 * Nota: Esta función requiere autenticación para leer anfitriones.
 * Si no hay autenticación, retorna false (permite registro como efímero)
 */
async function verificarEmailConEventos(email: string): Promise<boolean> {
  try {
    const authInstance = getAuth();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:verificarEmailConEventos',message:'Iniciando verificación de eventos por email',data:{email,hasAuth:!!authInstance.currentUser,authUid:authInstance.currentUser?.uid},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Si no hay usuario autenticado, no podemos leer anfitriones por email
    // En este caso, asumimos que no tiene eventos (el usuario se registrará como efímero)
    // Esto es correcto porque durante el registro aún no hay usuario autenticado
    if (!authInstance.currentUser) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:verificarEmailConEventos',message:'Sin usuario autenticado, retornando false (permite registro efímero)',data:{email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return false;
    }
    
    // Buscar anfitriones con este email (solo si estamos autenticados)
    const anfitrionesRef = collection(db, 'anfitriones');
    const q = query(anfitrionesRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:verificarEmailConEventos',message:'Query ejecutada',data:{email,resultsCount:querySnapshot.size},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    if (querySnapshot.empty) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:verificarEmailConEventos',message:'No se encontraron anfitriones con este email',data:{email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return false;
    }

    // Verificar si alguno tiene eventos creados
    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      const eventosCreados = data.eventosCreados || 0;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:verificarEmailConEventos',message:'Revisando anfitrión',data:{anfitrionId:docSnap.id,eventosCreados},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      if (eventosCreados > 0) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:verificarEmailConEventos',message:'Email tiene eventos creados',data:{email,anfitrionId:docSnap.id,eventosCreados},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        return true;
      }
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:verificarEmailConEventos',message:'Email no tiene eventos creados',data:{email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return false;
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:verificarEmailConEventos',message:'Error al verificar eventos del email',data:{email,error:error instanceof Error?error.message:String(error),errorCode:(error as any)?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    console.error('[Auth] Error al verificar eventos del email:', error);
    // Si hay error de permisos, retornar false para permitir el registro
    // (el usuario se registrará como efímero y luego podrá hacer onboarding si es necesario)
    return false;
  }
}

/**
 * Verificar si existe un documento de anfitrión en Firestore para un email
 * Si no existe pero el usuario está en Auth, crearlo automáticamente
 */
async function verificarOCrearAnfitrionEnFirestore(
  email: string,
  userId: string,
  displayName: string
): Promise<{ existe: boolean; creado: boolean }> {
  try {
    // Buscar anfitriones con este email o userId
    const anfitrionesRef = collection(db, 'anfitriones');
    const qEmail = query(anfitrionesRef, where('email', '==', email));
    const querySnapshotEmail = await getDocs(qEmail);

    // También verificar por userId directamente
    const anfitrionRef = doc(db, 'anfitriones', userId);
    const anfitrionSnap = await getDoc(anfitrionRef);

    // Si existe por userId, retornar
    if (anfitrionSnap.exists()) {
      return { existe: true, creado: false };
    }

    // Si existe por email pero con diferente userId, también retornar
    if (!querySnapshotEmail.empty) {
      return { existe: true, creado: false };
    }

    // No existe, crear el documento
    const nuevoAnfitrion = {
      userId: userId,
      email: email,
      nombreAnfitrion: displayName,
      alias: displayName,
      tipo: 'permanente', // Usuarios autenticados son permanentes por defecto
      tipoUsuario: 'permanente', // Campo adicional para verificación de permisos
      emailVerificado: false,
      eventosCreados: 0,
      passwordUsada: false,
      creadoEn: serverTimestamp(),
      ultimoAcceso: serverTimestamp()
    };
    await setDoc(anfitrionRef, nuevoAnfitrion);

    // Registrar creación en el changelog
    try {
      
      
      const logsRef = collection(db, 'admin_logs');
      await addDoc(logsRef, {
        accion: 'create',
        coleccion: 'anfitriones',
        documentoId: userId,
        datos: nuevoAnfitrion,
        datosAnteriores: null,
        descripcion: `Anfitrión creado: ${nombreAnfitrion || email}`,
        usuario: nombreAnfitrion || email || 'Sistema',
        timestamp: serverTimestamp()
      });
      
      
      console.log('[Auth] ✅ Log de creación de anfitrión registrado en changelog');
    } catch (logError: any) {
      
      console.warn('[Auth] Error al registrar log de creación de anfitrión:', logError);
      // No bloquear el flujo si falla el logging
    }

    return { existe: false, creado: true };
  } catch (error) {
    console.error('[Auth] Error al verificar/crear anfitrión en Firestore:', error);
    return { existe: false, creado: false };
  }
}

/**
 * Registrar nuevo anfitrión efímero (sin contraseña, se genera automáticamente)
 * @deprecated Usar registerUser de auth-service.ts en su lugar
 * Mantenido por compatibilidad hacia atrás
 */
export async function registrarAnfitrionEfimero(
  email: string,
  displayName: string,
  recaptchaToken?: string
): Promise<AuthResult & { redirectToOnboarding?: boolean; password?: string }> {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:registrarAnfitrionEfimero',message:'Inicio de registrarAnfitrionEfimero',data:{email: email, displayName: displayName, hasRecaptchaToken: !!recaptchaToken},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'debug_signup_1'})}).catch(()=>{});
  // #endregion
  
  try {
    const { registerUser } = await import('./services/auth-service.ts');
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:registrarAnfitrionEfimero',message:'Verificando si email tiene eventos',data:{email: email.trim().toLowerCase()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'debug_signup_1'})}).catch(()=>{});
    // #endregion
    
    // Verificar si el email ya tiene eventos creados
    const emailTrimmed = email.trim().toLowerCase();
    const tieneEventos = await verificarEmailConEventos(emailTrimmed);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:registrarAnfitrionEfimero',message:'Resultado de verificarEmailConEventos',data:{tieneEventos: tieneEventos},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'debug_signup_1'})}).catch(()=>{});
    // #endregion
    
    if (tieneEventos) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:registrarAnfitrionEfimero',message:'Email tiene eventos, retornando redirectToOnboarding',data:{email: emailTrimmed},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'debug_signup_1'})}).catch(()=>{});
      // #endregion
      return {
        success: false,
        redirectToOnboarding: true,
        error: 'Este email ya ha sido usado para crear eventos. Te invitamos a completar el proceso de registro como Anfitrión Persistente.'
      };
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:registrarAnfitrionEfimero',message:'Llamando registerUser',data:{email: email, alias: displayName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'debug_signup_1'})}).catch(()=>{});
    // #endregion
    
    const result = await registerUser({
      email,
      alias: displayName,
      aceptaTerminos: true // Asumir aceptación para compatibilidad
    });
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:registrarAnfitrionEfimero',message:'Resultado de registerUser',data:{success: result.success, hasError: !!result.error, hasPassword: !!result.password},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'debug_signup_1'})}).catch(()=>{});
    // #endregion
    
    return {
      ...result,
      password: result.password // Incluir password si fue generado
    };
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:registrarAnfitrionEfimero',message:'Excepción en registrarAnfitrionEfimero',data:{error: error?.message, code: error?.code, stack: error?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'debug_signup_1'})}).catch(()=>{});
    // #endregion
    console.error('[Auth] Error en registrarAnfitrionEfimero:', error);
    return {
      success: false,
      error: error?.message || 'Error inesperado al registrar usuario'
    };
  }
}

/**
 * Obtener información del anfitrión desde Firestore
 */
export async function obtenerAnfitrionDesdeFirestore(uid: string) {
  try {
    const anfitrionRef = doc(db, 'anfitriones', uid);
    const anfitrionSnap = await getDoc(anfitrionRef);

    if (anfitrionSnap.exists()) {
      const data = anfitrionSnap.data();
      return {
        tipo: data.tipo || 'registrado',
        userId: data.userId || uid,
        nombreAnfitrion: data.nombreAnfitrion || data.displayName,
        email: data.email,
        emailVerificado: data.emailVerificado || false
      };
    }

    return null;
  } catch (error) {
    console.error('[Auth] Error al obtener anfitrión:', error);
    return null;
  }
}

/**
 * Módulo de Verificación de Email
 * Maneja la verificación de email después del registro
 */

import { 
  getAuth,
  applyActionCode,
  reload,
  updatePassword
} from 'firebase/auth';
import { 
  getUsuarioActualAuth, 
  reenviarVerificacionEmail,
  onAuthStateChange 
} from './auth.js';
import { sendPasswordEmail } from './services/email-service.ts';
import { getUserProfile, updateUserProfile } from './services/user-service.ts';
import { generateSimplePassword } from './utils/password-generator.ts';

// Elementos del DOM
const mensajeDiv = document.getElementById('mensaje') as HTMLElement | null;
const btnReenviar = document.getElementById('btnReenviar') as HTMLButtonElement | null;
const emailDisplay = document.getElementById('emailDisplay') as HTMLElement | null;

/**
 * Manejar código de verificación desde URL
 * Ahora maneja tanto oobCode de Firebase como tokens personalizados
 */
async function manejarCodigoVerificacion(oobCode: string, verificationToken?: string, email?: string) {
  try {
    const auth = getAuth();
    let user = auth.currentUser;
    
    // Si hay verificationToken personalizado, el usuario aún no existe - crearlo
    if (verificationToken && !oobCode) {
      console.log('[Verify Email] Token personalizado detectado - creando usuario...');
      
      // Obtener datos pendientes de Firestore
      const { getPendingRegistrationByToken, markPendingRegistrationAsVerified } = await import('./services/user-service.ts');
      const pendingResult = await getPendingRegistrationByToken(verificationToken);
      
      if (!pendingResult.success || !pendingResult.data) {
        mostrarEstado('error', 'El enlace de verificación es inválido o ya fue usado. Por favor, solicita un nuevo enlace.');
        return;
      }
      
      const pendingData = pendingResult.data;
      
      // Crear usuario en Firebase Auth
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      const password = generateSimplePassword(10); // Password temporal
      const alias = email?.split('@')[0] || pendingData.email.split('@')[0];
      
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        pendingData.email,
        password
      );
      
      user = userCredential.user;
      
      // Actualizar perfil con displayName
      await updateProfile(user, {
        displayName: alias
      });
      
      // Crear perfil en Firestore
      const { createUserProfile, logUserAction } = await import('./services/user-service.ts');
      await createUserProfile(user.uid, {
        email: user.email!,
        telefono: pendingData.telefono,
        instagram: pendingData.instagram,
        nombreAnfitrion: alias,
        alias: alias,
        tipo: 'efimero', // Todos son efímeros inicialmente
        emailVerificado: true, // Ya está verificado porque confirmó el email
        passwordTemporal: password,
        passwordUsada: false,
        passwordEnviado: false,
        aceptaTerminos: pendingData.aceptaTerminos,
        fechaAceptacionTerminos: pendingData.fechaAceptacionTerminos?.toDate ? pendingData.fechaAceptacionTerminos.toDate() : new Date(),
        versionTerminos: pendingData.versionTerminos || '1.0'
      });
      
      // Marcar registro pendiente como verificado
      await markPendingRegistrationAsVerified(pendingData.id);
      
      // Registrar en changelog
      await logUserAction({
        accion: 'create',
        coleccion: 'anfitriones',
        documentoId: user.uid,
        datos: {
          email: user.email,
          telefono: pendingData.telefono,
          instagram: pendingData.instagram,
          tipo: 'efimero'
        },
        datosAnteriores: null,
        descripcion: `Usuario efímero creado después de verificar email: ${alias} (${user.email})`,
        usuario: alias || user.email || 'Sistema',
        timestamp: new Date()
      });
      
      console.log('[Verify Email] Usuario creado exitosamente después de verificar email');
    } else if (oobCode) {
      // Es un código de Firebase - usuario ya existe
      // Validar formato del código antes de intentar usarlo
      if (!oobCode || oobCode.length < 20) {
        mostrarEstado('error', 'Error: El código de verificación no tiene un formato válido. Por favor, solicita un nuevo enlace.');
        return;
      }
      
      // Decodificar el código si está URL-encoded
      const decodedCode = decodeURIComponent(oobCode);
      
      await applyActionCode(auth, decodedCode);
      
      // Recargar el usuario para obtener el estado actualizado
      if (auth.currentUser && auth.currentUser.uid && auth.currentUser.uid.length > 20) {
        try {
          await reload(auth.currentUser);
          user = auth.currentUser;
        } catch (reloadError: any) {
          console.warn('[Verify Email] Error al recargar usuario (no crítico):', reloadError);
        }
      }
    } else {
      mostrarEstado('error', 'Error: No se proporcionó código de verificación válido.');
      return;
    }
    
    // DESPUÉS de verificar el email (o crear el usuario), generar y enviar el OTP
    if (user && user.email) {
      try {
        // Obtener perfil del usuario
        const profileResult = await getUserProfile(user.uid);
        
        if (profileResult.success && profileResult.profile) {
          const profile = profileResult.profile;
          
          // Generar y enviar OTP después de verificar el email (para todos los usuarios)
          if (!profile.otpUsado) {
            // Generar OTP de 6 dígitos
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            
            // Actualizar el password en Firebase Auth con el OTP
            try {
              await updatePassword(user, otp);
              console.log('[Verify Email] Password actualizado en Firebase Auth con OTP');
            } catch (updateError: any) {
              console.error('[Verify Email] Error al actualizar password en Firebase Auth:', updateError);
            }
            
            // Guardar OTP en el perfil
            await updateUserProfile(user.uid, {
              otp: otp,
              otpUsado: false,
              otpExpiraEn: undefined, // OTP nunca expira
              emailVerificado: true
            });
            
            // Enviar email con el OTP
            await sendPasswordEmail({
              email: user.email,
              nombre: profile.nombreAnfitrion || profile.alias || user.email.split('@')[0],
              password: otp,
              anfitrionId: user.uid
            });
            
            console.log('[Verify Email] OTP generado y enviado después de verificación');
          } else {
            // Si el OTP ya fue usado, solo marcar como verificado
            await updateUserProfile(user.uid, {
              emailVerificado: true
            });
          }
        }
      } catch (passwordError: any) {
        console.error('[Verify Email] Error al generar/enviar password después de verificación:', passwordError);
      }
    }
    
    mostrarEstado('success');
    
    // Limpiar URL
    const url = new URL(window.location.href);
    url.searchParams.delete('oobCode');
    url.searchParams.delete('mode');
    url.searchParams.delete('verificationToken');
    url.searchParams.delete('email');
    window.history.replaceState({}, '', url.toString());
    
    // Redirigir a login después de verificación exitosa
    setTimeout(() => {
      window.location.href = '/auth/login';
    }, 2000);
  } catch (error: any) {
    console.error('[Verify Email] Error al verificar:', error);
    
    let mensajeError = 'Error al verificar el email. ';
    if (error.code === 'auth/invalid-action-code') {
      mensajeError += 'El enlace de verificación ha expirado o ya fue usado. ';
      mensajeError += 'Por favor, solicita un nuevo enlace de verificación usando el botón de abajo.';
    } else if (error.code === 'auth/expired-action-code') {
      mensajeError += 'El enlace de verificación ha expirado. Por favor, solicita uno nuevo usando el botón de abajo.';
    } else if (error.code === 'auth/user-disabled') {
      mensajeError += 'Tu cuenta ha sido deshabilitada. Por favor, contacta al soporte.';
    } else if (error.code === 'auth/user-not-found') {
      mensajeError += 'Usuario no encontrado. Por favor, verifica que estés usando el enlace correcto.';
    } else if (error.code === 'auth/email-already-in-use') {
      mensajeError += 'Este email ya está registrado. Por favor, inicia sesión.';
    } else {
      mensajeError += error.message || 'Por favor, intenta nuevamente.';
    }
    
    mostrarEstado('error', mensajeError);
  }
}

/**
 * Verificar estado de verificación de email
 */
async function verificarEstadoEmail() {
  // Verificar si hay código de verificación en la URL
  const urlParams = new URLSearchParams(window.location.search);
  const oobCode = urlParams.get('oobCode');
  const verificationToken = urlParams.get('verificationToken');
  const email = urlParams.get('email');
  const mode = urlParams.get('mode');
  const apiKey = urlParams.get('apiKey');
  const continueUrl = urlParams.get('continueUrl');
  const lang = urlParams.get('lang');
  
  // Si hay token personalizado, procesarlo (usuario aún no existe)
  if (verificationToken && email) {
    await manejarCodigoVerificacion('', verificationToken, email);
    return;
  }
  
  // Si hay código de verificación de Firebase, procesarlo (usuario ya existe)
  if (oobCode && (mode === 'verifyEmail' || !mode)) {
    // Validar que el código tenga un formato válido
    if (!oobCode || oobCode.length < 20) {
      mostrarEstado('error', 'Error: El código de verificación no es válido. Por favor, solicita un nuevo enlace.');
      return;
    }
    await manejarCodigoVerificacion(oobCode);
    return;
  }
  
  const user = getUsuarioActualAuth();
  
  if (!user) {
    // No hay usuario autenticado, redirigir a login
    window.location.href = '/';
    return;
  }

  // Mostrar email
  if (emailDisplay && user.email) {
    emailDisplay.textContent = user.email;
  }
  
  // Mostrar botón de reenviar si está disponible
  if (btnReenviar) {
    btnReenviar.style.display = 'block';
  }

  // Si el email ya está verificado, redirigir
  if (user.emailVerified) {
    mostrarEstado('success');
    setTimeout(() => {
      window.location.href = '/auth/login';
    }, 2000);
    return;
  }

  // Escuchar cambios en el estado de verificación
  onAuthStateChange((updatedUser) => {
    if (updatedUser && updatedUser.emailVerified) {
      mostrarEstado('success');
      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 2000);
    }
  });
}

/**
 * Reenviar email de verificación
 */
async function handleReenviarEmail() {
  if (!btnReenviar) return;

  btnReenviar.disabled = true;
  const btnText = btnReenviar.querySelector('span') as HTMLElement | null;
  if (btnText) {
    btnText.textContent = 'Enviando...';
  }

  try {
    // Verificar si hay usuario autenticado
    const user = getUsuarioActualAuth();
    if (!user) {
      mostrarEstado('error', 'Por favor, inicia sesión primero para reenviar el email de verificación.');
      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 2000);
      return;
    }

    const result = await reenviarVerificacionEmail();

    if (result.success) {
      mostrarMensaje('✅ Email de verificación reenviado. Revisa tu bandeja de entrada (y la carpeta de spam).', 'success');
    } else {
      mostrarMensaje(result.error || 'Error al reenviar email', 'error');
    }
  } catch (error: any) {
    console.error('[Verify Email] Error:', error);
    mostrarMensaje('Error inesperado al reenviar email', 'error');
  } finally {
    btnReenviar.disabled = false;
    if (btnText) {
      btnText.textContent = 'Reenviar Email de Verificación';
    }
  }
}

/**
 * Mostrar mensaje
 */
function mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'info' = 'info') {
  if (!mensajeDiv) return;

  mensajeDiv.textContent = mensaje;
  mensajeDiv.classList.remove('hidden', 'text-green-600', 'text-red-600', 'text-blue-600');
  
  if (tipo === 'success') {
    mensajeDiv.classList.add('text-green-600');
  } else if (tipo === 'error') {
    mensajeDiv.classList.add('text-red-600');
  } else {
    mensajeDiv.classList.add('text-blue-600');
  }
}

// Inicializar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    verificarEstadoEmail();
    if (btnReenviar) {
      btnReenviar.addEventListener('click', handleReenviarEmail);
    }
  });
} else {
  verificarEstadoEmail();
  if (btnReenviar) {
    btnReenviar.addEventListener('click', handleReenviarEmail);
  }
}

/**
 * Servicio principal de autenticación
 * Unifica registro, login y verificación usando servicios internos
 */

import { 
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  updatePassword,
  sendEmailVerification,
  UserCredential
} from 'firebase/auth';
import { app } from '../../core/firebase-init';
import type { RegisterParams, RegisterResult, LoginParams, AuthResult } from '../types/auth-types.ts';
import { validateRegisterParams, validateLoginParams, isValidPassword } from '../utils/validators.ts';
import { generateSimplePassword } from '../utils/password-generator.ts';
import { createUserProfile, updateUserProfile, logUserAction } from './user-service.ts';
import { sendVerificationEmail, sendPasswordEmail } from './email-service.ts';

const auth = getAuth(app);

/**
 * Registrar usuario unificado
 * Reemplaza registrarAnfitrion y registrarAnfitrionEfimero
 */
export async function registerUser(params: RegisterParams): Promise<RegisterResult> {
  try {
    // Validar parámetros
    const validation = validateRegisterParams(params);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join(', ')
      };
    }

    // NO crear usuario todavía - solo guardar datos pendientes
    // El usuario se creará DESPUÉS de verificar el email
    
    // Generar token único para verificación
    const verificationToken = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${params.email.split('@')[0]}`;
    
    // Guardar datos pendientes en Firestore
    const { savePendingRegistration } = await import('./user-service.ts');
    const pendingResult = await savePendingRegistration({
      email: params.email.trim().toLowerCase(),
      telefono: params.telefono?.trim(),
      instagram: params.instagram?.trim(),
      aceptaTerminos: params.aceptaTerminos,
      fechaAceptacionTerminos: params.fechaAceptacionTerminos || new Date(),
      verificationToken: verificationToken
    });

    if (!pendingResult.success) {
      return {
        success: false,
        error: pendingResult.error || 'Error al guardar datos de registro'
      };
    }

    // Generar alias desde email
    const alias = params.email.split('@')[0];

    // Enviar email de verificación con el token
    try {
      await sendVerificationEmail({
        email: params.email.trim().toLowerCase(),
        nombre: alias,
        anfitrionId: '', // Aún no hay anfitrionId porque el usuario no existe
        tokenVerificacion: verificationToken // Usar el token en lugar del ID token
      });
    } catch (emailError: any) {
      console.error('[AuthService] Error al enviar email de verificación:', emailError);
      return {
        success: false,
        error: 'Error al enviar email de verificación. Por favor, intenta nuevamente.'
      };
    }

    // Retornar éxito pero sin usuario (aún no se ha creado)
    return {
      success: true,
      // No retornar user porque aún no existe
      verificationToken: verificationToken // Token para referencia
    };
  } catch (error: any) {
    console.error('[AuthService] Error al registrar usuario:', error);
    
    let errorMessage = 'Error al registrar usuario';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Este email ya está registrado';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Email inválido';
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
 * Login de usuario
 */
export async function loginUser(params: LoginParams): Promise<AuthResult> {
  try {
    // Validar parámetros
    const validation = validateLoginParams(params);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join(', ')
      };
    }

    // Verificar si el usuario tiene OTP activo antes de intentar login
    // Si tiene OTP activo, solo aceptar el OTP como password
    const { getUserProfile } = await import('./user-service.ts');
    
    // Intentar obtener el usuario por email desde Firestore para verificar OTP
    // Nota: Esto requiere una búsqueda en Firestore, pero por ahora intentamos login directo
    // y verificamos después si el password es el OTP
    
    let userCredential: UserCredential;
    let loginError: any = null;
    
    try {
      userCredential = await signInWithEmailAndPassword(
        auth,
        params.email.trim().toLowerCase(),
        params.password
      );
    } catch (error: any) {
      loginError = error;
      // Si el login falla, podría ser porque el usuario tiene OTP activo
      // y está intentando usar un password diferente al OTP
      throw error;
    }

    const user = userCredential.user;

    // Obtener perfil para verificar si el login fue con OTP
    const profileResult = await getUserProfile(user.uid);
    let profile = null;
    let requiereCambioPassword = false;
    
    if (profileResult.success && profileResult.profile) {
      profile = profileResult.profile;
      
      // Verificar si el usuario tiene OTP activo y aún no ha establecido password permanente
      if (profile.otp && !profile.otpUsado) {
        // Si el password ingresado NO es el OTP, rechazar el login
        if (profile.otp !== params.password) {
          await auth.signOut();
          return {
            success: false,
            error: 'Debes usar el código OTP enviado por correo para iniciar sesión por primera vez.'
          };
        }
        
        // OTP válido - marcar como usado y requerir cambio de password
        // Nota: El OTP no expira (se eliminó la verificación de expiración)
        await updateUserProfile(user.uid, {
          otpUsado: true,
          otp: undefined, // Limpiar por seguridad
          otpExpiraEn: undefined,
          requiereCambioPassword: true // Requerir cambio de password
        });
        
        requiereCambioPassword = true;
        console.log('[AuthService] Login exitoso con OTP - usuario debe establecer password permanente');
      }
    }

    // Actualizar último acceso en Firestore
    await updateUserProfile(user.uid, {
      ultimoAcceso: new Date()
    });

    // Si es efímero y tiene passwordTemporal sin usar, marcarla como usada
    if (profile && profile.tipo === 'efimero' && profile.passwordTemporal && !profile.passwordUsada) {
      await updateUserProfile(user.uid, {
        passwordUsada: true,
        passwordTemporal: undefined // Limpiar por seguridad
      });
    }

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        photoURL: user.photoURL
      },
      requiereCambioPassword: requiereCambioPassword
    };
  } catch (error: any) {
    console.error('[AuthService] Error al iniciar sesión:', error);
    
    let errorMessage = 'Error al iniciar sesión';
    
    if (error.code === 'auth/invalid-credential') {
      errorMessage = 'Credenciales incorrectas. Verifica tu email y contraseña';
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = 'Usuario no encontrado';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Contraseña incorrecta';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Email inválido';
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = 'Usuario deshabilitado';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Demasiados intentos fallidos. Por favor, intenta más tarde';
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
 * Cambiar password del usuario
 * Requiere que el usuario esté autenticado y valida el password con estándares modernos
 */
export async function changePassword(params: {
  newPassword: string;
  currentPassword?: string; // Opcional, solo si el usuario ya tiene password permanente
}): Promise<{ success: boolean; error?: string }> {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return {
        success: false,
        error: 'Debes estar autenticado para cambiar tu contraseña'
      };
    }

    // Validar el nuevo password con estándares modernos
    const passwordValidation = isValidPassword(params.newPassword, true);
    if (!passwordValidation.valid) {
      return {
        success: false,
        error: passwordValidation.error || 'La contraseña no cumple con los requisitos de seguridad'
      };
    }

    // Si el usuario tiene password permanente, verificar el password actual
    if (params.currentPassword) {
      try {
        // Verificar que el password actual sea correcto
        // Esto se hace intentando reautenticar al usuario
        const { EmailAuthProvider, reauthenticateWithCredential } = await import('firebase/auth');
        const credential = EmailAuthProvider.credential(
          user.email!,
          params.currentPassword
        );
        await reauthenticateWithCredential(user, credential);
      } catch (reauthError: any) {
        return {
          success: false,
          error: 'La contraseña actual es incorrecta'
        };
      }
    }

    // Actualizar el password
    await updatePassword(user, params.newPassword);

    // Actualizar el perfil para indicar que ya no requiere cambio de password
    const { updateUserProfile, getUserProfile } = await import('./user-service.ts');
    const profileResult = await getUserProfile(user.uid);
    
    if (profileResult.success && profileResult.profile) {
      await updateUserProfile(user.uid, {
        requiereCambioPassword: false
      });
    }

    console.log('[AuthService] Password actualizado exitosamente');
    
    return {
      success: true
    };
  } catch (error: any) {
    console.error('[AuthService] Error al cambiar password:', error);
    
    let errorMessage = 'Error al cambiar la contraseña';
    
    if (error.code === 'auth/weak-password') {
      errorMessage = 'La contraseña es muy débil. Debe cumplir con los requisitos de seguridad.';
    } else if (error.code === 'auth/requires-recent-login') {
      errorMessage = 'Por seguridad, debes iniciar sesión nuevamente antes de cambiar tu contraseña.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}





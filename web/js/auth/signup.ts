/**
 * Módulo de Registro Unificado de Usuarios
 * Usa el nuevo servicio de autenticación modular
 */

import { registerUser } from './services/auth-service.ts';
import { validateRegisterParams } from './utils/validators.ts';
import { onboardingJourney, STEPS } from '../ui/onboarding-journey.js';
import { reenviarVerificacionEmail } from './auth.ts';

// Elementos del DOM
const form = document.getElementById('formSignupUser') as HTMLFormElement | null;
const emailInput = document.getElementById('email') as HTMLInputElement | null;
const telefonoInput = document.getElementById('telefono') as HTMLInputElement | null;
const instagramInput = document.getElementById('instagram') as HTMLInputElement | null;
const aceptaTerminosInput = document.getElementById('aceptaTerminos') as HTMLInputElement | null;
const btnEnviar = document.getElementById('btnEnviar') as HTMLButtonElement | null;
const btnText = document.getElementById('btnText') as HTMLElement | null;
const mensajeDiv = document.getElementById('mensaje') as HTMLElement | null;
const mensajeExitoContainer = document.getElementById('mensajeExitoContainer') as HTMLElement | null;
const progressIndicators = document.getElementById('progressIndicators') as HTMLElement | null;
const btnReenviarEmail = document.getElementById('btnReenviarEmail') as HTMLButtonElement | null;
const btnIrALogin = document.getElementById('btnIrALogin') as HTMLButtonElement | null;
const verificationEmail = document.getElementById('verificationEmail') as HTMLElement | null;

/**
 * Inicializar formulario
 */
function inicializar(): void {
  if (!form || !emailInput || !telefonoInput || !btnEnviar) {
    console.error('[Signup User] Elementos del DOM no encontrados');
    return;
  }

  // Verificar si estamos en el paso de verificación
  const urlParams = new URLSearchParams(window.location.search);
  const step = urlParams.get('step');
  
  if (step === 'verify') {
    mostrarPasoVerificacion();
  }

  form.addEventListener('submit', async (e: SubmitEvent) => {
    e.preventDefault();
    await handleSignup();
  });

  // Configurar botones de verificación
  if (btnReenviarEmail) {
    btnReenviarEmail.addEventListener('click', async () => {
      await handleReenviarEmail();
    });
  }

  if (btnIrALogin) {
    btnIrALogin.addEventListener('click', () => {
      const email = onboardingJourney.getUserEmail();
      if (email) {
        window.location.href = `/auth/login.html?email=${encodeURIComponent(email)}`;
      } else {
        window.location.href = '/auth/login.html';
      }
    });
  }
}

/**
 * Manejar registro
 */
async function handleSignup(): Promise<void> {
  if (!emailInput || !telefonoInput || !btnEnviar) {
    return;
  }

  const email = emailInput.value.trim();
  const telefono = telefonoInput.value.trim();
  const instagram = instagramInput ? instagramInput.value.trim() : '';
  const aceptaTerminos = aceptaTerminosInput ? aceptaTerminosInput.checked : false;

  // Validar parámetros usando el validador del servicio
  const validation = validateRegisterParams({
    email,
    telefono,
    instagram: instagram || undefined,
    aceptaTerminos
  });

  if (!validation.valid) {
    mostrarMensaje(validation.errors.join('. '), 'error');
    return;
  }

  // Deshabilitar botón
  btnEnviar.disabled = true;
  if (btnText) btnText.textContent = 'Creando cuenta...';

  try {
    // Usar registerUser del nuevo servicio que genera contraseña automáticamente si no se proporciona
    const result = await registerUser({
      email,
      telefono,
      instagram: instagram || undefined,
      aceptaTerminos,
      fechaAceptacionTerminos: new Date()
    });

    if (result.success) {
      // Guardar estado en OnboardingJourney
      onboardingJourney.setUserEmail(email);
      onboardingJourney.setNewUser(true);
      onboardingJourney.setStep(STEPS.VERIFY);
      
      // Mostrar indicadores de progreso
      if (progressIndicators) {
        progressIndicators.classList.remove('hidden');
        // Actualizar indicadores visuales
        updateProgressIndicators(STEPS.VERIFY);
      }
      
      // Ocultar formulario y mostrar mensaje de éxito
      if (form) form.classList.add('hidden');
      if (mensajeExitoContainer) mensajeExitoContainer.classList.remove('hidden');
      
      // Mostrar email en el mensaje de verificación
      if (verificationEmail) {
        verificationEmail.textContent = email;
      }
      
      // No redirigir, el usuario debe verificar desde el email
    } else {
      // Mostrar mensaje de error con link a login si el email ya está registrado
      const errorMsg = result.error || 'Error al crear la cuenta';
      mostrarMensaje(errorMsg, 'error');
      
      // Si el error es que el email ya está registrado, mostrar mensaje
      if (errorMsg.includes('ya está registrado') || errorMsg.includes('email-already-in-use')) {
        // El mensaje ya se muestra en mostrarMensaje
      }
      
      btnEnviar.disabled = false;
      if (btnText) btnText.textContent = 'Crear cuenta';
    }
  } catch (error: unknown) {
    console.error('[Signup User] Error:', error);
    let errorMsg = 'Error inesperado al crear la cuenta';
    
    // Intentar extraer mensaje de error más específico
    if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/email-already-in-use') {
      errorMsg = 'Este email ya está registrado. Por favor, inicia sesión.';
    } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      errorMsg = error.message;
    }
    
    mostrarMensaje(errorMsg, 'error');
    btnEnviar.disabled = false;
    if (btnText) btnText.textContent = 'Crear cuenta';
  }
}

/**
 * Mostrar mensaje
 */
function mostrarMensaje(mensaje: string, tipo: 'error' | 'success'): void {
  if (!mensajeDiv) {
    console.warn('[Signup User] mensajeDiv no encontrado');
    return;
  }
  
  mensajeDiv.textContent = mensaje;
  mensajeDiv.className = `rounded-lg p-3 text-sm ${tipo === 'error' ? 'error-message text-white' : 'success-message text-white'}`;
  mensajeDiv.classList.remove('hidden');
  
  // Scroll suave al mensaje para asegurar visibilidad
  mensajeDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  
  // Ocultar después de 8 segundos (más tiempo para errores importantes)
  const timeout = tipo === 'error' ? 8000 : 5000;
  setTimeout(() => {
    if (mensajeDiv) {
      mensajeDiv.classList.add('hidden');
    }
  }, timeout);
}

/**
 * Mostrar paso de verificación
 */
function mostrarPasoVerificacion(): void {
  if (form) form.classList.add('hidden');
  if (mensajeExitoContainer) mensajeExitoContainer.classList.remove('hidden');
  if (progressIndicators) {
    progressIndicators.classList.remove('hidden');
    updateProgressIndicators(STEPS.VERIFY);
  }
  
  const email = onboardingJourney.getUserEmail();
  if (verificationEmail && email) {
    verificationEmail.textContent = email;
  }
}

/**
 * Actualizar indicadores de progreso
 */
function updateProgressIndicators(currentStep: string): void {
  if (!progressIndicators) return;
  
  const steps = [
    { step: STEPS.SIGNUP, index: 0 },
    { step: STEPS.VERIFY, index: 1 },
    { step: STEPS.LOGIN, index: 2 }
  ];
  
  const currentIndex = steps.findIndex(s => s.step === currentStep);
  
  steps.forEach((s, index) => {
    const stepIndicator = progressIndicators.children[index * 2];
    if (stepIndicator) {
      const circle = stepIndicator.querySelector('div');
      const text = stepIndicator.querySelector('span');
      
      if (index <= currentIndex) {
        if (circle) {
          circle.classList.remove('bg-white/20', 'text-white/60');
          circle.classList.add('bg-white/30', 'text-white');
        }
        if (text) {
          text.classList.remove('text-white/60');
          text.classList.add('text-white');
        }
      } else {
        if (circle) {
          circle.classList.remove('bg-white/30', 'text-white');
          circle.classList.add('bg-white/20', 'text-white/60');
        }
        if (text) {
          text.classList.remove('text-white');
          text.classList.add('text-white/60');
        }
      }
    }
  });
}

/**
 * Manejar reenvío de email de verificación
 */
async function handleReenviarEmail(): Promise<void> {
  if (!btnReenviarEmail) return;
  
  btnReenviarEmail.disabled = true;
  const originalText = btnReenviarEmail.textContent || '';
  btnReenviarEmail.textContent = 'Enviando...';
  
  try {
    const result = await reenviarVerificacionEmail();
    
    if (result.success) {
      mostrarMensaje('Email de verificación reenviado. Revisa tu bandeja de entrada.', 'success');
    } else {
      mostrarMensaje(result.error || 'Error al reenviar el email', 'error');
    }
  } catch (error) {
    console.error('[Signup] Error al reenviar email:', error);
    mostrarMensaje('Error inesperado al reenviar el email', 'error');
  } finally {
    btnReenviarEmail.disabled = false;
    btnReenviarEmail.textContent = originalText;
  }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializar);
} else {
  inicializar();
}


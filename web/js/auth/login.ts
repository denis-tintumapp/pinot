/**
 * Módulo de Login Unificado de Usuarios
 * Usa el nuevo servicio de autenticación modular
 */

import { loginUser } from './services/auth-service.ts';
import { validateLoginParams } from './utils/validators.ts';
import { onboardingJourney, STEPS } from '../ui/onboarding-journey.js';

// Elementos del DOM
const loginForm = document.getElementById('formLoginUser') as HTMLFormElement | null;
const emailInput = document.getElementById('loginEmail') as HTMLInputElement | null;
const passwordInput = document.getElementById('loginPassword') as HTMLInputElement | null;
const btnEnviar = document.getElementById('btnEnviar') as HTMLButtonElement | null;
const btnText = document.getElementById('btnText') as HTMLElement | null;
const mensajeDiv = document.getElementById('mensaje') as HTMLElement | null;

/**
 * Inicializar formulario
 */
function inicializar(): void {
  if (!loginForm || !emailInput || !passwordInput || !btnEnviar) {
    console.error('[Login User] Elementos del DOM no encontrados');
    return;
  }

  loginForm.addEventListener('submit', async (e: SubmitEvent) => {
    e.preventDefault();
    await handleLogin();
  });

  // Auto-rellenar email si viene en la URL
  const urlParams = new URLSearchParams(window.location.search);
  const emailParam = urlParams.get('email');
  if (emailParam && emailInput) {
    emailInput.value = decodeURIComponent(emailParam);
  }
}

/**
 * Manejar login
 */
async function handleLogin(): Promise<void> {
  if (!emailInput || !passwordInput || !btnEnviar) {
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  // Validar parámetros usando el validador del servicio
  const validation = validateLoginParams({
    email,
    password
  });

  if (!validation.valid) {
    mostrarMensaje(validation.errors.join('. '), 'error');
    return;
  }

  // Deshabilitar botón
  btnEnviar.disabled = true;
  if (btnText) btnText.textContent = 'Iniciando sesión...';

  try {
    // Usar loginUser del nuevo servicio
    const result = await loginUser({
      email,
      password
    });

    if (result.success && result.user) {
      mostrarMensaje('Iniciando sesión...', 'success');
      
      // Actualizar estado de onboarding
      onboardingJourney.setStep(STEPS.LOGIN);
      
      // Verificar si el usuario viene del flujo de onboarding
      const isNewUser = onboardingJourney.getIsNewUser();
      
      // Obtener URL de redirección
      const urlParams = new URLSearchParams(window.location.search);
      let redirect = urlParams.get('redirect');
      
      // Si es nuevo usuario y no hay redirect específico, ir a perfil
      if (!redirect && isNewUser) {
        redirect = '/profile.html';
        onboardingJourney.setStep(STEPS.PROFILE);
      } else if (!redirect) {
        redirect = '/';
      }
      
      // Redirigir después de un breve delay
      setTimeout(() => {
        window.location.href = redirect!;
      }, 500);
    } else {
      mostrarMensaje(result.error || 'Error al iniciar sesión', 'error');
      btnEnviar.disabled = false;
      if (btnText) btnText.textContent = 'Iniciar Sesión';
    }
  } catch (error: unknown) {
    console.error('[Login User] Error:', error);
    mostrarMensaje('Error inesperado al iniciar sesión', 'error');
    btnEnviar.disabled = false;
    if (btnText) btnText.textContent = 'Iniciar Sesión';
  }
}

/**
 * Mostrar mensaje
 */
function mostrarMensaje(mensaje: string, tipo: 'error' | 'success'): void {
  if (!mensajeDiv) return;
  
  mensajeDiv.textContent = mensaje;
  mensajeDiv.className = `hidden rounded-lg p-4 text-sm ${tipo === 'error' ? 'error-message text-white' : 'success-message text-white'}`;
  mensajeDiv.classList.remove('hidden');
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializar);
} else {
  inicializar();
}


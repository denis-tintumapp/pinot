/**
 * Componente de gestión del flujo de onboarding
 * Maneja el estado y navegación entre pasos del proceso de registro
 */

const STORAGE_KEY = 'pinot_onboarding_journey';
const STEPS = {
  SIGNUP: 'signup',
  VERIFY: 'verify',
  LOGIN: 'login',
  PROFILE: 'profile'
};

export class OnboardingJourney {
  constructor() {
    this.currentStep = this.getCurrentStep();
    this.userEmail = this.getUserEmail();
    this.isNewUser = this.getIsNewUser();
  }

  /**
   * Obtener paso actual desde localStorage
   */
  getCurrentStep() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return data.step || STEPS.SIGNUP;
      }
    } catch (error) {
      console.error('[OnboardingJourney] Error al leer paso actual:', error);
    }
    return STEPS.SIGNUP;
  }

  /**
   * Establecer paso actual
   */
  setStep(step) {
    if (!Object.values(STEPS).includes(step)) {
      console.error('[OnboardingJourney] Paso inválido:', step);
      return;
    }

    this.currentStep = step;
    this.saveState();
  }

  /**
   * Guardar estado en localStorage
   */
  saveState() {
    try {
      const data = {
        step: this.currentStep,
        email: this.userEmail,
        isNewUser: this.isNewUser,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[OnboardingJourney] Error al guardar estado:', error);
    }
  }

  /**
   * Obtener email del usuario desde localStorage
   */
  getUserEmail() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return data.email || null;
      }
    } catch (error) {
      console.error('[OnboardingJourney] Error al leer email:', error);
    }
    return null;
  }

  /**
   * Establecer email del usuario
   */
  setUserEmail(email) {
    this.userEmail = email;
    this.saveState();
  }

  /**
   * Obtener si es usuario nuevo
   */
  getIsNewUser() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return data.isNewUser || false;
      }
    } catch (error) {
      console.error('[OnboardingJourney] Error al leer isNewUser:', error);
    }
    return false;
  }

  /**
   * Marcar como usuario nuevo
   */
  setNewUser(isNew = true) {
    this.isNewUser = isNew;
    this.saveState();
  }

  /**
   * Avanzar al siguiente paso
   */
  goToNextStep() {
    const stepOrder = [STEPS.SIGNUP, STEPS.VERIFY, STEPS.LOGIN, STEPS.PROFILE];
    const currentIndex = stepOrder.indexOf(this.currentStep);
    
    if (currentIndex < stepOrder.length - 1) {
      this.setStep(stepOrder[currentIndex + 1]);
      return stepOrder[currentIndex + 1];
    }
    
    return this.currentStep;
  }

  /**
   * Volver al paso anterior
   */
  goToPreviousStep() {
    const stepOrder = [STEPS.SIGNUP, STEPS.VERIFY, STEPS.LOGIN, STEPS.PROFILE];
    const currentIndex = stepOrder.indexOf(this.currentStep);
    
    if (currentIndex > 0) {
      this.setStep(stepOrder[currentIndex - 1]);
      return stepOrder[currentIndex - 1];
    }
    
    return this.currentStep;
  }

  /**
   * Verificar estado de verificación de email
   * Retorna una promesa que se resuelve cuando el email está verificado
   */
  async checkEmailVerificationStatus() {
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      
      if (auth.currentUser) {
        await auth.currentUser.reload();
        return auth.currentUser.emailVerified;
      }
      
      return false;
    } catch (error) {
      console.error('[OnboardingJourney] Error al verificar email:', error);
      return false;
    }
  }

  /**
   * Limpiar estado del onboarding (cuando se completa)
   */
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      this.currentStep = STEPS.SIGNUP;
      this.userEmail = null;
      this.isNewUser = false;
    } catch (error) {
      console.error('[OnboardingJourney] Error al limpiar estado:', error);
    }
  }

  /**
   * Obtener URL de redirección según el paso actual
   */
  getRedirectUrl() {
    const baseUrl = window.location.origin;
    
    switch (this.currentStep) {
      case STEPS.SIGNUP:
        return `${baseUrl}/auth/signup.html`;
      case STEPS.VERIFY:
        return `${baseUrl}/auth/signup.html?step=verify`;
      case STEPS.LOGIN:
        return `${baseUrl}/auth/login.html`;
      case STEPS.PROFILE:
        return `${baseUrl}/profile.html`;
      default:
        return `${baseUrl}/`;
    }
  }

  /**
   * Redirigir al paso actual
   */
  redirectToCurrentStep() {
    const url = this.getRedirectUrl();
    window.location.href = url;
  }

  /**
   * Redirigir al siguiente paso
   */
  redirectToNextStep() {
    this.goToNextStep();
    this.redirectToCurrentStep();
  }
}

// Exportar instancia singleton
export const onboardingJourney = new OnboardingJourney();

// Exportar constantes de pasos
export { STEPS };

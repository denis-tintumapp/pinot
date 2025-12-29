/**
 * Validadores reutilizables
 * Funciones puras para validar datos de entrada
 */

/**
 * Validar formato de email
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validar alias (nombre de usuario)
 * @param alias - Alias a validar
 * @param minLength - Longitud mínima (por defecto 2)
 * @param maxLength - Longitud máxima (por defecto 50)
 */
export function isValidAlias(
  alias: string, 
  minLength: number = 2, 
  maxLength: number = 50
): { valid: boolean; error?: string } {
  if (!alias || typeof alias !== 'string') {
    return { valid: false, error: 'El alias es requerido' };
  }
  
  const trimmed = alias.trim();
  
  if (trimmed.length < minLength) {
    return { 
      valid: false, 
      error: `El alias debe tener al menos ${minLength} caracteres` 
    };
  }
  
  if (trimmed.length > maxLength) {
    return { 
      valid: false, 
      error: `El alias no puede tener más de ${maxLength} caracteres` 
    };
  }
  
  // Permitir letras, números, guiones y guiones bajos
  const aliasRegex = /^[a-zA-Z0-9_-]+$/;
  if (!aliasRegex.test(trimmed)) {
    return { 
      valid: false, 
      error: 'El alias solo puede contener letras, números, guiones y guiones bajos' 
    };
  }
  
  return { valid: true };
}

/**
 * Validar contraseña con estándares modernos
 * Requisitos:
 * - Mínimo 8 caracteres
 * - Al menos una letra mayúscula
 * - Al menos una letra minúscula
 * - Al menos un número
 * - Al menos un carácter especial
 * @param password - Contraseña a validar
 * @param strict - Si es true, aplica validación estricta (por defecto true)
 */
export function isValidPassword(
  password: string, 
  strict: boolean = true
): { valid: boolean; error?: string; requirements?: { [key: string]: boolean } } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'La contraseña es requerida' };
  }
  
  if (!strict) {
    // Validación básica (mínimo 6 caracteres)
    if (password.length < 6) {
      return { 
        valid: false, 
        error: 'La contraseña debe tener al menos 6 caracteres' 
      };
    }
    return { valid: true };
  }
  
  // Validación estricta con estándares modernos
  const requirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };
  
  const allMet = Object.values(requirements).every(req => req === true);
  
  if (!allMet) {
    const missing: string[] = [];
    if (!requirements.minLength) missing.push('al menos 8 caracteres');
    if (!requirements.hasUpperCase) missing.push('una letra mayúscula');
    if (!requirements.hasLowerCase) missing.push('una letra minúscula');
    if (!requirements.hasNumber) missing.push('un número');
    if (!requirements.hasSpecialChar) missing.push('un carácter especial (!@#$%^&*...)');
    
    return {
      valid: false,
      error: `La contraseña debe contener: ${missing.join(', ')}`,
      requirements
    };
  }
  
  return { valid: true, requirements };
}

/**
 * Validar teléfono (opcional)
 * @param telefono - Teléfono a validar (opcional)
 */
export function isValidTelefono(
  telefono?: string
): { valid: boolean; error?: string } {
  // Teléfono es opcional, si no se proporciona es válido
  if (!telefono || typeof telefono !== 'string') {
    return { valid: true };
  }
  
  const trimmed = telefono.trim();
  
  // Si está vacío después de trim, es válido (opcional)
  if (trimmed.length === 0) {
    return { valid: true };
  }
  
  // Permitir números, espacios, guiones, paréntesis y el símbolo +
  // Mínimo 8 dígitos, máximo 20 caracteres
  const telefonoRegex = /^[\d\s\+\-\(\)]{8,20}$/;
  
  // Contar solo dígitos para validar longitud mínima
  const digitos = trimmed.replace(/\D/g, '');
  
  if (digitos.length < 8) {
    return { 
      valid: false, 
      error: 'El teléfono debe tener al menos 8 dígitos' 
    };
  }
  
  if (digitos.length > 15) {
    return { 
      valid: false, 
      error: 'El teléfono no puede tener más de 15 dígitos' 
    };
  }
  
  if (!telefonoRegex.test(trimmed)) {
    return { 
      valid: false, 
      error: 'Formato de teléfono inválido' 
    };
  }
  
  return { valid: true };
}

/**
 * Validar Instagram (opcional)
 * @param instagram - Usuario de Instagram a validar
 */
export function isValidInstagram(
  instagram: string
): { valid: boolean; error?: string } {
  if (!instagram || typeof instagram !== 'string') {
    // Instagram es opcional
    return { valid: true };
  }
  
  const trimmed = instagram.trim();
  
  if (trimmed.length === 0) {
    return { valid: true };
  }
  
  // Validar formato de usuario de Instagram: letras, números, puntos y guiones bajos
  // Debe empezar con letra o número, mínimo 1 carácter, máximo 30 caracteres
  const instagramRegex = /^[a-zA-Z0-9][a-zA-Z0-9._]{0,29}$/;
  
  if (!instagramRegex.test(trimmed)) {
    return { 
      valid: false, 
      error: 'El usuario de Instagram solo puede contener letras, números, puntos y guiones bajos' 
    };
  }
  
  if (trimmed.length > 30) {
    return { 
      valid: false, 
      error: 'El usuario de Instagram no puede tener más de 30 caracteres' 
    };
  }
  
  return { valid: true };
}

/**
 * Validar parámetros de registro
 */
export function validateRegisterParams(params: {
  email: string;
  telefono?: string; // Opcional
  instagram?: string;
  password?: string;
  aceptaTerminos: boolean;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validar email
  if (!isValidEmail(params.email)) {
    errors.push('Email inválido');
  }
  
  // Validar teléfono (opcional)
  if (params.telefono) {
    const telefonoValidation = isValidTelefono(params.telefono);
    if (!telefonoValidation.valid) {
      errors.push(telefonoValidation.error || 'Teléfono inválido');
    }
  }
  
  // Validar Instagram (opcional)
  if (params.instagram) {
    const instagramValidation = isValidInstagram(params.instagram);
    if (!instagramValidation.valid) {
      errors.push(instagramValidation.error || 'Usuario de Instagram inválido');
    }
  }
  
  // Validar contraseña si se proporciona
  if (params.password) {
    const passwordValidation = isValidPassword(params.password);
    if (!passwordValidation.valid) {
      errors.push(passwordValidation.error || 'Contraseña inválida');
    }
  }
  
  // Validar aceptación de términos
  if (!params.aceptaTerminos) {
    errors.push('Debes aceptar los términos y condiciones');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validar parámetros de login
 */
export function validateLoginParams(params: {
  email: string;
  password: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!params.email || !isValidEmail(params.email)) {
    errors.push('Email inválido');
  }
  
  if (!params.password || params.password.length === 0) {
    errors.push('La contraseña es requerida');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}







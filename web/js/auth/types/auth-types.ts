/**
 * Tipos compartidos para autenticación
 * Define interfaces y tipos utilizados en todo el módulo de autenticación
 */

/**
 * Parámetros para registro de usuario
 */
export interface RegisterParams {
  email: string;
  telefono?: string; // Opcional
  instagram?: string;
  password?: string; // Opcional, se genera automáticamente si no se proporciona
  aceptaTerminos: boolean;
  fechaAceptacionTerminos?: Date;
}

/**
 * Resultado del registro
 */
export interface RegisterResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  password?: string; // Contraseña generada (solo para usuarios efímeros)
  verificationToken?: string; // Token de verificación (cuando el usuario aún no se ha creado)
}

/**
 * Parámetros para envío de email
 */
export interface EmailParams {
  tipo: 'verification' | 'password' | 'event'; // Nombres más claros
  email: string;
  nombre?: string;
  anfitrionId?: string;
  tokenVerificacion?: string;
  verificationLink?: string; // Nuevo: link completo de verificación
  password?: string;
  eventoId?: string;
  eventoNombre?: string;
  eventoPIN?: string;
  urlBase?: string;
}

/**
 * Resultado del envío de email
 */
export interface EmailResult {
  success: boolean;
  error?: string;
}

/**
 * Perfil de usuario en Firestore
 */
export interface UserProfile {
  userId: string;
  email: string;
  telefono?: string; // Opcional
  instagram?: string;
  nombreAnfitrion?: string;
  alias?: string;
  nombreCompleto?: string;
  tipo: 'registrado' | 'efimero';
  emailVerificado: boolean;
  passwordTemporal?: string;
  passwordUsada?: boolean;
  passwordEnviado?: boolean; // Indica si el password ya fue enviado después de verificar el email
  otp?: string; // OTP (One-Time Password) para primer login
  otpUsado?: boolean; // Indica si el OTP ya fue usado
  otpExpiraEn?: any; // Timestamp de expiración del OTP
  requiereCambioPassword?: boolean; // Indica si el usuario debe cambiar su password después del login con OTP
  creadoEn: any; // Timestamp de Firestore
  ultimoAcceso?: any; // Timestamp de Firestore
  aceptaTerminos?: boolean;
  fechaAceptacionTerminos?: any; // Timestamp de Firestore
  versionTerminos?: string;
}

/**
 * Usuario autenticado
 */
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  photoURL: string | null;
}

/**
 * Resultado de autenticación
 */
export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  requiereCambioPassword?: boolean; // Indica si el usuario debe cambiar su password
}

/**
 * Parámetros para login
 */
export interface LoginParams {
  email: string;
  password: string;
  recaptchaToken?: string;
}

/**
 * Parámetros para verificación de email
 */
export interface VerifyEmailParams {
  email: string;
  actionCode?: string;
}

/**
 * Resultado de verificación
 */
export interface VerifyResult {
  success: boolean;
  error?: string;
}

/**
 * Acción de changelog
 */
export interface ChangelogAction {
  accion: 'create' | 'update' | 'delete';
  coleccion: string;
  documentoId: string;
  datos?: any;
  datosAnteriores?: any;
  descripcion: string;
  usuario: string;
  timestamp: any; // Timestamp de Firestore
}







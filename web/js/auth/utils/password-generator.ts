/**
 * Generador de contraseñas
 * Función pura para generar contraseñas seguras
 */

/**
 * Generar una contraseña aleatoria segura
 * @param length - Longitud de la contraseña (por defecto 12)
 * @returns Contraseña generada
 */
export function generatePassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const password = [];
  
  // Asegurar al menos un carácter de cada tipo
  password.push(getRandomChar('abcdefghijklmnopqrstuvwxyz')); // minúscula
  password.push(getRandomChar('ABCDEFGHIJKLMNOPQRSTUVWXYZ')); // mayúscula
  password.push(getRandomChar('0123456789')); // número
  password.push(getRandomChar('!@#$%^&*')); // especial
  
  // Completar el resto con caracteres aleatorios
  for (let i = password.length; i < length; i++) {
    password.push(getRandomChar(charset));
  }
  
  // Mezclar los caracteres para que no siempre estén en el mismo orden
  return shuffleArray(password).join('');
}

/**
 * Obtener un carácter aleatorio de un conjunto
 */
function getRandomChar(charset: string): string {
  return charset[Math.floor(Math.random() * charset.length)];
}

/**
 * Mezclar un array (algoritmo Fisher-Yates)
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generar una contraseña más simple (solo letras y números, sin caracteres especiales)
 * Útil para usuarios que pueden tener problemas con caracteres especiales
 * @param length - Longitud de la contraseña (por defecto 10)
 * @returns Contraseña generada
 */
export function generateSimplePassword(length: number = 10): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const password = [];
  
  // Asegurar al menos un carácter de cada tipo
  password.push(getRandomChar('abcdefghijklmnopqrstuvwxyz')); // minúscula
  password.push(getRandomChar('ABCDEFGHIJKLMNOPQRSTUVWXYZ')); // mayúscula
  password.push(getRandomChar('0123456789')); // número
  
  // Completar el resto
  for (let i = password.length; i < length; i++) {
    password.push(getRandomChar(charset));
  }
  
  return shuffleArray(password).join('');
}




















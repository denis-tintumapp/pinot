/**
 * Helpers de validación usando Zod
 */

import { z } from 'zod';

/**
 * Valida datos usando un esquema Zod
 * @param schema - Esquema Zod para validar
 * @param data - Datos a validar
 * @returns Objeto con success y data o error
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error };
  }
}

/**
 * Valida datos y lanza error si falla
 * @param schema - Esquema Zod para validar
 * @param data - Datos a validar
 * @returns Datos validados
 * @throws ZodError si la validación falla
 */
export function validateDataOrThrow<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  return schema.parse(data);
}

/**
 * Valida datos de forma segura y retorna el resultado
 * @param schema - Esquema Zod para validar
 * @param data - Datos a validar
 * @returns Resultado de la validación
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): z.SafeParseReturnType<unknown, T> {
  return schema.safeParse(data);
}

/**
 * Formatea errores de Zod para mostrar al usuario
 * @param error - Error de Zod
 * @returns Mensaje de error formateado
 */
export function formatZodError(error: z.ZodError): string {
  const firstError = error.errors[0];
  if (firstError) {
    const path = firstError.path.join('.');
    return `${path ? `${path}: ` : ''}${firstError.message}`;
  }
  return 'Error de validación';
}

/**
 * Obtiene todos los mensajes de error de Zod
 * @param error - Error de Zod
 * @returns Array de mensajes de error
 */
export function getZodErrorMessages(error: z.ZodError): string[] {
  return error.errors.map((err) => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });
}

/**
 * Valida datos de Firestore antes de usarlos
 * Útil para validar datos que vienen de Firestore
 */
export function validateFirestoreData<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`[Validation] Error validando datos de Firestore${context ? ` (${context})` : ''}:`, error.errors);
      throw new Error(`Datos inválidos de Firestore${context ? ` en ${context}` : ''}: ${formatZodError(error)}`);
    }
    throw error;
  }
}

/**
 * Valida datos antes de escribir en Firestore
 * Útil para validar datos antes de guardarlos
 */
export function validateBeforeFirestore<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`[Validation] Error validando datos antes de Firestore${context ? ` (${context})` : ''}:`, error.errors);
      throw new Error(`Datos inválidos${context ? ` en ${context}` : ''}: ${formatZodError(error)}`);
    }
    throw error;
  }
}


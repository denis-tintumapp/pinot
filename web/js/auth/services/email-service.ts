/**
 * Servicio de emails en cliente
 * Abstrae las llamadas a Cloud Functions para envío de emails
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../core/firebase-init';
import type { EmailParams, EmailResult } from '../types/auth-types.ts';

const functions = getFunctions(app, 'us-central1');

/**
 * Enviar email de verificación
 * Ahora acepta un token personalizado en lugar de un ID token de Firebase
 */
export async function sendVerificationEmail(params: {
  email: string;
  nombre: string;
  anfitrionId: string; // Puede estar vacío si el usuario aún no existe
  tokenVerificacion: string; // Token personalizado o ID token de Firebase
}): Promise<EmailResult> {
  try {
    const enviarEmail = httpsCallable(functions, 'OnboardingEmail');
    
    const emailParams: EmailParams = {
      tipo: 'verification',
      email: params.email,
      nombre: params.nombre,
      anfitrionId: params.anfitrionId,
      tokenVerificacion: params.tokenVerificacion
    };

    console.log('[EmailService] Enviando email de verificación con parámetros:', {
      tipo: emailParams.tipo,
      email: emailParams.email,
      nombre: emailParams.nombre,
      anfitrionId: emailParams.anfitrionId,
      tieneToken: !!emailParams.tokenVerificacion,
      tokenLength: emailParams.tokenVerificacion?.length
    });

    const result = await enviarEmail(emailParams);
    
    console.log('[EmailService] Respuesta de OnboardingEmail:', result);
    
    return {
      success: true
    };
  } catch (error: any) {
    console.error('[EmailService] Error al enviar email de verificación:', error);
    console.error('[EmailService] Detalles del error:', {
      code: error.code,
      message: error.message,
      details: error.details
    });
    
    // Si es un error 500, intentar con método estándar de Firebase como fallback
    if (error.code === 'internal' || error.code === 'unknown' || error.message?.includes('500')) {
      console.warn('[EmailService] Error 500 detectado, el servidor puede tener problemas temporales');
      return {
        success: false,
        error: 'Error temporal del servidor. Por favor, intenta nuevamente en unos momentos.'
      };
    }
    
    return {
      success: false,
      error: error.message || 'Error al enviar email de verificación'
    };
  }
}

/**
 * Enviar email con contraseña
 */
export async function sendPasswordEmail(params: {
  email: string;
  nombre: string;
  password: string;
  anfitrionId?: string;
}): Promise<EmailResult> {
  try {
    const enviarEmail = httpsCallable(functions, 'OnboardingEmail');
    
    const emailParams: EmailParams = {
      tipo: 'password',
      email: params.email,
      nombre: params.nombre,
      password: params.password,
      anfitrionId: params.anfitrionId
    };

    const result = await enviarEmail(emailParams);
    
    return {
      success: true
    };
  } catch (error: any) {
    console.error('[EmailService] Error al enviar email con contraseña:', error);
    return {
      success: false,
      error: error.message || 'Error al enviar email con contraseña'
    };
  }
}

/**
 * Enviar email de confirmación de evento
 */
export async function sendEventConfirmationEmail(params: {
  email: string;
  nombre: string;
  eventoId: string;
  eventoNombre: string;
  eventoPIN?: string;
  urlBase?: string;
}): Promise<EmailResult> {
  try {
    const enviarEmail = httpsCallable(functions, 'OnboardingEmail');
    
    const emailParams: EmailParams = {
      tipo: 'event',
      email: params.email,
      nombre: params.nombre,
      eventoId: params.eventoId,
      eventoNombre: params.eventoNombre,
      eventoPIN: params.eventoPIN,
      urlBase: params.urlBase
    };

    const result = await enviarEmail(emailParams);
    
    return {
      success: true
    };
  } catch (error: any) {
    console.error('[EmailService] Error al enviar email de evento:', error);
    return {
      success: false,
      error: error.message || 'Error al enviar email de evento'
    };
  }
}







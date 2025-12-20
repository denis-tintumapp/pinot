/**
 * Cloud Functions para Pinot
 * Envío de emails de confirmación para anfitriones usando Gmail API
 * Migrado a la nueva API de params (reemplaza functions.config())
 */

const functions = require('firebase-functions/v1');
const { defineJsonSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const { google } = require('googleapis');

// Inicializar Firebase Admin
admin.initializeApp();

// Definir secret exportado desde functions.config()
// Este secret contiene toda la configuración: gmail (client_id, client_secret, refresh_token, user, oauth_email) y recaptcha (secret_key)
const configSecret = defineJsonSecret('FUNCTIONS_CONFIG_EXPORT');

/**
 * Configurar cliente OAuth2 para Gmail API
 * Usa la nueva API de params (secrets) en lugar de functions.config()
 */
function getGmailClient() {
  // Obtener configuración desde el secret exportado
  const config = configSecret.value();
  
  // Configuración OAuth2 desde el secret
  const clientId = config?.gmail?.client_id || process.env.GMAIL_CLIENT_ID;
  const clientSecret = config?.gmail?.client_secret || process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = config?.gmail?.refresh_token || process.env.GMAIL_REFRESH_TOKEN;
  // Email del remitente (usar hello@tintum.app como alias)
  const emailUser = config?.gmail?.user || process.env.GMAIL_USER || 'hello@tintum.app';
  // Email de la cuenta OAuth (debe ser denis@tintum.app para autenticación)
  const oauthEmail = config?.gmail?.oauth_email || process.env.GMAIL_OAUTH_EMAIL || 'denis@tintum.app';
  
  if (!clientId || !clientSecret || !refreshToken) {
    console.warn('⚠️ Gmail API credentials not configured. Email sending will be disabled.');
    return null;
  }
  
  // Configurar OAuth2
  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'urn:ietf:wg:oauth:2.0:oob' // Redirect URI para aplicaciones instaladas
  );
  
  // Establecer refresh token
  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });
  
  // Crear cliente de Gmail
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  
  return { gmail, emailUser, oauthEmail };
}

/**
 * Función auxiliar para enviar email usando Gmail API (reutilizable)
 */
async function enviarEmailConfirmacionAux(data) {
  const { email, nombre, tokenVerificacion, anfitrionId } = data;
  
  const gmailClient = getGmailClient();
  if (!gmailClient) {
    console.warn('Gmail API no configurado, saltando envío de email');
    return { success: false, message: 'Gmail API no configurado' };
  }
  
  const { gmail, emailUser, oauthEmail } = gmailClient;
  const baseUrl = 'https://pinot.tintum.app';
  const verificationUrl = `${baseUrl}/auth/verify-email.html?token=${tokenVerificacion}&anfitrionId=${anfitrionId}`;
  
  // Crear el contenido HTML del email
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmación de cuenta</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Pinot</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">El vino como juego. El disfrute como premio.</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #667eea;">¡Bienvenido, ${nombre}!</h2>
        
        <p>Gracias por registrarte como anfitrión en Pinot. Estamos emocionados de tenerte con nosotros.</p>
        
        <p>Para completar tu registro y verificar tu cuenta, por favor haz clic en el siguiente botón:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    display: inline-block;
                    font-weight: bold;">
            Confirmar mi cuenta
          </a>
        </div>
        
        <p style="font-size: 12px; color: #666;">O copia y pega este enlace en tu navegador:</p>
        <p style="font-size: 12px; color: #667eea; word-break: break-all;">${verificationUrl}</p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666;">
          Si no creaste esta cuenta, puedes ignorar este email.
        </p>
        
        <p style="font-size: 12px; color: #666; margin-top: 20px;">
          Este enlace expirará en 7 días por seguridad.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
        <p>© ${new Date().getFullYear()} Pinot. Todos los derechos reservados.</p>
      </div>
    </body>
    </html>
  `;
  
  // Crear el contenido de texto plano
  const textContent = `
Bienvenido a Pinot, ${nombre}!

Gracias por registrarte como anfitrión. Para confirmar tu cuenta, visita:
${verificationUrl}

Si no creaste esta cuenta, puedes ignorar este email.

Este enlace expirará en 7 días.
  `;
  
  // Codificar el email en formato RFC 2822
  // Usar hello@tintum.app como remitente (alias)
  const message = [
    `From: Pinot <${emailUser}>`,
    `Reply-To: ${emailUser}`,
    `To: ${email}`,
    `Subject: Bienvenido a Pinot - Confirma tu cuenta de anfitrión`,
    `Content-Type: text/html; charset=utf-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    htmlContent
  ].join('\n');
  
  // Codificar en base64url (Gmail API requiere este formato)
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  try {
    // Enviar email usando Gmail API
    // userId: 'me' usa la cuenta autenticada (denis@tintum.app)
    // pero el remitente será hello@tintum.app (alias configurado)
    const response = await gmail.users.messages.send({
      userId: 'me', // Usa la cuenta OAuth (denis@tintum.app)
      requestBody: {
        raw: encodedMessage
      }
    });
    
    return { 
      success: true, 
      messageId: response.data.id,
      threadId: response.data.threadId
    };
  } catch (error) {
    console.error('Error al enviar email con Gmail API:', error);
    throw error;
  }
}

/**
 * Verificar token de reCAPTCHA v3
 * Valida el token con Google y devuelve el score
 * Usa la nueva API de params
 */
async function verificarRecaptcha(token) {
  if (!token) {
    return { valid: false, score: 0, reason: 'Token no proporcionado' };
  }
  
  // Obtener secret key desde el secret exportado
  const config = configSecret.value();
  const SECRET_KEY = config?.recaptcha?.secret_key || process.env.RECAPTCHA_SECRET_KEY || '6LfqsDEsAAAAAJnZ0LvsbKCxX0aslVqY2sT1TTI4';
  
  try {
    const axios = require('axios');
    const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
      params: {
        secret: SECRET_KEY,
        response: token
      }
    });
    
    const { success, score, action, challenge_ts } = response.data;
    
    console.log('reCAPTCHA verificación:', { success, score, action, challenge_ts });
    
    // reCAPTCHA v3 devuelve un score de 0.0 a 1.0
    // 1.0 = muy probablemente humano
    // 0.0 = muy probablemente bot
    // Recomendado: aceptar scores >= 0.5
    
    if (success && score >= 0.5 && action === 'submit_signup') {
      return { valid: true, score, action };
    }
    
    return { 
      valid: false, 
      score, 
      action,
      reason: score < 0.5 ? 'Score bajo (posible bot)' : 'Acción incorrecta'
    };
  } catch (error) {
    console.error('Error al verificar reCAPTCHA:', error);
    return { valid: false, error: error.message };
  }
}

/**
 * Cloud Function HTTP para enviar email de confirmación
 * Se llama desde el frontend después de crear un anfitrión
 * Configurada como callable pero también accesible vía HTTP a través de rewrite
 * Migrada a la nueva API de params con secrets vinculados
 * 
 * Cuando se accede vía rewrite de Firebase Hosting, funciona como HTTP endpoint
 * con formato compatible con callable functions
 */
exports.enviarEmailConfirmacion = functions
  .runWith({ secrets: [configSecret] }) // Vincular el secret exportado
  .https.onCall(async (data, context) => {
  try {
    const { email, nombre, tokenVerificacion, anfitrionId, recaptchaToken } = data;
    
    if (!email || !nombre || !tokenVerificacion) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Faltan datos requeridos: email, nombre, tokenVerificacion'
      );
    }
    
    // Validar reCAPTCHA si se proporciona token
    if (recaptchaToken) {
      const recaptchaResult = await verificarRecaptcha(recaptchaToken);
      console.log('Resultado validación reCAPTCHA:', recaptchaResult);
      
      if (!recaptchaResult.valid) {
        console.warn('⚠️ reCAPTCHA falló:', recaptchaResult.reason || recaptchaResult.error);
        // No bloquear el envío, solo registrar para auditoría
        // En producción, podrías decidir bloquear si el score es muy bajo
      }
    } else {
      console.warn('⚠️ No se proporcionó token de reCAPTCHA');
    }
    
    console.log('📧 Iniciando envío de email a:', email);
    console.log('📧 Datos recibidos:', { email, nombre, anfitrionId, tieneToken: !!tokenVerificacion });
    
    const result = await enviarEmailConfirmacionAux({ email, nombre, tokenVerificacion, anfitrionId });
    
    console.log('📧 Resultado del envío:', result);
    
    if (!result.success) {
      console.error('❌ Error al enviar email:', result.message || 'Error desconocido');
      // Retornar error para que el frontend lo maneje
      throw new functions.https.HttpsError(
        'internal',
        result.message || 'Error al enviar el email de confirmación'
      );
    }
    
    console.log('✅ Email enviado exitosamente:', result.messageId);
    return { 
      success: true, 
      messageId: result.messageId,
      message: 'Email enviado correctamente'
    };
    
  } catch (error) {
    console.error('Error al enviar email:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Error al enviar el email de confirmación',
      error.message
    );
  }
});

/**
 * Versión HTTP de la función para acceso vía rewrite de Firebase Hosting
 * Compatible con el formato de funciones callable cuando se accede vía /api/enviarEmailConfirmacion
 */
exports.enviarEmailConfirmacionHTTP = functions
  .runWith({ secrets: [configSecret] })
  .https.onRequest(async (req, res) => {
    // Configurar CORS explícitamente
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Manejar preflight
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    
    // Solo permitir POST
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    
    try {
      // Extraer datos (puede venir en req.body.data si es formato callable, o directamente)
      const requestData = req.body.data || req.body;
      const { email, nombre, tokenVerificacion, anfitrionId, recaptchaToken } = requestData;
      
      if (!email || !nombre || !tokenVerificacion) {
        res.status(400).json({
          success: false,
          error: 'Faltan datos requeridos: email, nombre, tokenVerificacion'
        });
        return;
      }
      
      // Validar reCAPTCHA si se proporciona token
      if (recaptchaToken) {
        const recaptchaResult = await verificarRecaptcha(recaptchaToken);
        console.log('Resultado validación reCAPTCHA:', recaptchaResult);
        
        if (!recaptchaResult.valid) {
          console.warn('⚠️ reCAPTCHA falló:', recaptchaResult.reason || recaptchaResult.error);
        }
      } else {
        console.warn('⚠️ No se proporcionó token de reCAPTCHA');
      }
      
      console.log('📧 Iniciando envío de email a:', email);
      console.log('📧 Datos recibidos:', { email, nombre, anfitrionId, tieneToken: !!tokenVerificacion });
      
      const result = await enviarEmailConfirmacionAux({ email, nombre, tokenVerificacion, anfitrionId });
      
      console.log('📧 Resultado del envío:', result);
      
      if (!result.success) {
        console.error('❌ Error al enviar email:', result.message || 'Error desconocido');
        res.status(500).json({
          success: false,
          error: result.message || 'Error al enviar el email de confirmación'
        });
        return;
      }
      
      console.log('✅ Email enviado exitosamente:', result.messageId);
      res.status(200).json({
        success: true,
        messageId: result.messageId,
        message: 'Email enviado correctamente'
      });
      
    } catch (error) {
      console.error('Error al enviar email:', error);
      res.status(500).json({
        success: false,
        error: 'Error al enviar el email de confirmación',
        details: error.message
      });
    }
  });

/**
 * Versión HTTP de la función para evitar problemas de CORS
 * Accesible a través de /api/enviarEmailConfirmacion
 * Compatible con el formato de funciones callable cuando se accede vía rewrite
 */
exports.enviarEmailConfirmacionHTTP = functions
  .runWith({ 
    secrets: [configSecret]
  })
  .https.onRequest(async (req, res) => {
    // Configurar CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Manejar preflight
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    
    // Solo permitir POST
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    
    try {
      // Extraer datos (puede venir en req.body.data si es formato callable, o directamente)
      const requestData = req.body.data || req.body;
      const { email, nombre, tokenVerificacion, anfitrionId, recaptchaToken } = requestData;
      
      if (!email || !nombre || !tokenVerificacion) {
        res.status(400).json({
          success: false,
          error: 'Faltan datos requeridos: email, nombre, tokenVerificacion'
        });
        return;
      }
      
      // Validar reCAPTCHA si se proporciona token
      if (recaptchaToken) {
        const recaptchaResult = await verificarRecaptcha(recaptchaToken);
        console.log('Resultado validación reCAPTCHA:', recaptchaResult);
        
        if (!recaptchaResult.valid) {
          console.warn('⚠️ reCAPTCHA falló:', recaptchaResult.reason || recaptchaResult.error);
        }
      } else {
        console.warn('⚠️ No se proporcionó token de reCAPTCHA');
      }
      
      console.log('📧 Iniciando envío de email a:', email);
      console.log('📧 Datos recibidos:', { email, nombre, anfitrionId, tieneToken: !!tokenVerificacion });
      
      const result = await enviarEmailConfirmacionAux({ email, nombre, tokenVerificacion, anfitrionId });
      
      console.log('📧 Resultado del envío:', result);
      
      if (!result.success) {
        console.error('❌ Error al enviar email:', result.message || 'Error desconocido');
        res.status(500).json({
          success: false,
          error: result.message || 'Error al enviar el email de confirmación'
        });
        return;
      }
      
      console.log('✅ Email enviado exitosamente:', result.messageId);
      res.status(200).json({
        success: true,
        messageId: result.messageId,
        message: 'Email enviado correctamente'
      });
      
    } catch (error) {
      console.error('Error al enviar email:', error);
      res.status(500).json({
        success: false,
        error: 'Error al enviar el email de confirmación',
        details: error.message
      });
    }
  });

/**
 * Trigger de Firestore: Enviar email cuando se crea un nuevo anfitrión
 * Alternativa automática (opcional, comentado por defecto)
 * Descomenta si quieres envío automático sin llamada desde frontend
 */
// exports.onAnfitrionCreado = functions.firestore
//   .document('anfitriones/{anfitrionId}')
//   .onCreate(async (snap, context) => {
//     try {
//       const anfitrionData = snap.data();
//       
//       if (!anfitrionData.email || !anfitrionData.tokenVerificacion) {
//         console.log('Anfitrión sin email o token, saltando envío de email');
//         return null;
//       }
//       
//       await enviarEmailConfirmacionAux({
//         email: anfitrionData.email,
//         nombre: anfitrionData.nombreAnfitrion || 'Anfitrión',
//         tokenVerificacion: anfitrionData.tokenVerificacion,
//         anfitrionId: context.params.anfitrionId
//       });
//       
//       console.log('Email de confirmación enviado automáticamente para:', anfitrionData.email);
//       return null;
//       
//     } catch (error) {
//       console.error('Error en trigger de anfitrión creado:', error);
//       return null;
//     }
//   });



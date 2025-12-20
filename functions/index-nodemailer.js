/**
 * Cloud Functions para Pinot - Versión con Nodemailer
 * Envío de emails de confirmación usando Nodemailer (SMTP)
 * 
 * Para usar esta versión:
 * 1. Renombra index.js a index-gmail-api.js (backup)
 * 2. Renombra este archivo a index.js
 * 3. Actualiza package.json: "nodemailer": "^6.9.7"
 * 4. Configura credenciales SMTP
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Inicializar Firebase Admin
admin.initializeApp();

/**
 * Configurar transporter de nodemailer
 * Usa hello@tintum.app como remitente (alias configurado en Google Workspace)
 */
function getTransporter() {
  // Configuración usando variables de entorno
  // Para Google Workspace (denis@tintum.app), usar App Password
  const emailUser = functions.config().email?.user || process.env.EMAIL_USER || 'denis@tintum.app';
  const emailPass = functions.config().email?.password || process.env.EMAIL_PASSWORD;
  const emailHost = functions.config().email?.host || process.env.EMAIL_HOST || 'smtp.gmail.com';
  const emailPort = parseInt(functions.config().email?.port || process.env.EMAIL_PORT || '587', 10);
  
  // Remitente visible (alias hello@tintum.app)
  const fromEmail = functions.config().email?.from || process.env.EMAIL_FROM || 'hello@tintum.app';
  
  if (!emailUser || !emailPass) {
    console.warn('⚠️ Email credentials not configured. Email sending will be disabled.');
    return null;
  }
  
  return nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: false, // true para 465, false para otros puertos
    auth: {
      user: emailUser, // Cuenta de autenticación (denis@tintum.app)
      pass: emailPass  // App Password
    }
  });
}

/**
 * Función auxiliar para enviar email usando Nodemailer (reutilizable)
 */
async function enviarEmailConfirmacionAux(data) {
  const { email, nombre, tokenVerificacion, anfitrionId } = data;
  
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('Email transporter no configurado, saltando envío de email');
    return { success: false, message: 'Email no configurado' };
  }
  
  const baseUrl = 'https://pinot.tintum.app';
  const verificationUrl = `${baseUrl}/auth/verify-email.html?token=${tokenVerificacion}&anfitrionId=${anfitrionId}`;
  
  // Remitente visible (hello@tintum.app)
  const fromEmail = functions.config().email?.from || process.env.EMAIL_FROM || 'hello@tintum.app';
  
  const mailOptions = {
    from: `"Pinot" <${fromEmail}>`, // Remitente visible: hello@tintum.app
    replyTo: fromEmail, // Reply-To también usa hello@tintum.app
    to: email,
    subject: 'Bienvenido a Pinot - Confirma tu cuenta de anfitrión',
    html: `
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
    `,
    text: `
      Bienvenido a Pinot, ${nombre}!
      
      Gracias por registrarte como anfitrión. Para confirmar tu cuenta, visita:
      ${verificationUrl}
      
      Si no creaste esta cuenta, puedes ignorar este email.
      
      Este enlace expirará en 7 días.
    `
  };
  
  const info = await transporter.sendMail(mailOptions);
  return { success: true, messageId: info.messageId };
}

/**
 * Cloud Function HTTP para enviar email de confirmación
 */
exports.enviarEmailConfirmacion = functions.https.onCall({
  cors: true
}, async (data, context) => {
  try {
    const { email, nombre, tokenVerificacion, anfitrionId } = data;
    
    if (!email || !nombre || !tokenVerificacion) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Faltan datos requeridos: email, nombre, tokenVerificacion'
      );
    }
    
    const result = await enviarEmailConfirmacionAux({ email, nombre, tokenVerificacion, anfitrionId });
    
    if (!result.success) {
      return result;
    }
    
    console.log('Email enviado exitosamente:', result.messageId);
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

import type { FirebaseConfig } from '../types/index.js';

// Configuración de Firebase
// Proyecto: Pinot (pinot-tintum)
// Project Number: 770959850208

export const firebaseConfig: FirebaseConfig = {
  apiKey: "AIzaSyDSlVFrQotnSPXr9PgvukWWkflYvN_lHWE",
  authDomain: "pinot-tintum.firebaseapp.com",
  projectId: "pinot-tintum",
  storageBucket: "pinot-tintum.firebasestorage.app",
  messagingSenderId: "770959850208",
  appId: "1:770959850208:web:9fa229d9e7dc6345d22e85",
  measurementId: "G-8ES4C8SCWK"
};

/**
 * VAPID Key para Firebase Cloud Messaging (FCM)
 * 
 * INSTRUCCIONES PARA OBTENER EL VAPID KEY:
 * 
 * 1. Ve a Firebase Console: https://console.firebase.google.com/project/pinot-tintum/settings/cloudmessaging
 * 
 * 2. En la sección "Web Push certificates", haz clic en "Generate key pair" 
 *    (o copia el key pair existente si ya fue generado)
 * 
 * 3. Copia el "Key pair" (es una cadena larga que comienza con algo como "BEl62iUYgUivx...")
 * 
 * 4. Pega el valor aquí abajo, reemplazando el valor actual
 * 
 * NOTA: El VAPID key es público y seguro de incluir en el código del cliente.
 *       Se usa para autenticar las solicitudes de suscripción a notificaciones push.
 */
export const VAPID_KEY: string = 'BEl62iUYgUivxIkv69yViEuiBIa1kQeP6vH3kZJzSswJ0vKHEPAMIvoTEN1Y2vyr4TjVrM2e5f5PBMz6ef2xE';

/**
 * reCAPTCHA v3 Site Key
 * 
 * Site Key obtenido del Secret Manager de Google Cloud
 * Este es el Site Key público que se usa en el frontend para invocar reCAPTCHA v3
 */
export const RECAPTCHA_SITE_KEY: string = '6LenATMsAAAAAAnM0OI4DcHN_882ML86OOCNRZHX';


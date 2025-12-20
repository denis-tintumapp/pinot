# 📧 Configuración de Gmail API para Envío de Emails

## 🎯 Resumen

Guía para configurar Gmail API en lugar de SMTP/Nodemailer para el envío de emails de confirmación de anfitriones.

## ✅ Ventajas de Gmail API

- ✅ **Mayor confiabilidad**: API oficial de Google
- ✅ **Mejor límite de envío**: Hasta 2,000 emails/día (vs 500 con SMTP)
- ✅ **Sin App Password**: Usa OAuth2 (más seguro)
- ✅ **Mejor tracking**: IDs de mensajes y threads
- ✅ **Rate limiting mejorado**: Menos bloqueos

## 📝 Pasos para Configurar

### 1. Crear Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Nombra el proyecto: `Pinot Email Service` (o similar)

### 2. Habilitar Gmail API

1. En el proyecto, ve a **APIs & Services** → **Library**
2. Busca "Gmail API"
3. Haz clic en **Enable** (Habilitar)

### 3. Crear Credenciales OAuth2

1. Ve a **APIs & Services** → **Credentials**
2. Haz clic en **Create Credentials** → **OAuth client ID**
3. Si es la primera vez, configura la **OAuth consent screen**:
   - **User Type**: Internal (si tienes Google Workspace) o External
   - **App name**: `Pinot Email Service`
   - **User support email**: `denis@tintum.app`
   - **Developer contact**: `denis@tintum.app`
   - Haz clic en **Save and Continue**
   - En **Scopes**, agrega: `https://www.googleapis.com/auth/gmail.send`
   - Completa los pasos restantes

4. Crea las credenciales OAuth2:
   - **Application type**: `Desktop app` o `Web application`
   - **Name**: `Pinot Gmail API`
   - Haz clic en **Create**
   - **Copia el Client ID y Client Secret** (los necesitarás)

### 4. Obtener Refresh Token

Para obtener el refresh token, necesitas ejecutar un script de autorización:

#### Opción A: Script Node.js (Recomendado)

Crea un archivo temporal `get-refresh-token.js`:

```javascript
const { google } = require('googleapis');
const readline = require('readline');

const CLIENT_ID = 'TU_CLIENT_ID_AQUI';
const CLIENT_SECRET = 'TU_CLIENT_SECRET_AQUI';
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent' // Forzar consent para obtener refresh token
});

console.log('Autoriza esta aplicación visitando esta URL:');
console.log(authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Ingresa el código de autorización aquí: ', (code) => {
  rl.close();
  
  oauth2Client.getToken(code, (err, token) => {
    if (err) {
      console.error('Error al obtener token:', err);
      return;
    }
    
    console.log('\n✅ Credenciales OAuth2:');
    console.log('Client ID:', CLIENT_ID);
    console.log('Client Secret:', CLIENT_SECRET);
    console.log('Refresh Token:', token.refresh_token);
    console.log('\n⚠️  Guarda estos valores de forma segura!');
  });
});
```

Ejecuta:
```bash
cd functions
npm install googleapis
node get-refresh-token.js
```

Sigue las instrucciones:
1. Visita la URL que se muestra
2. Autoriza la aplicación
3. Copia el código de autorización
4. Pégalo en la terminal
5. Copia el **Refresh Token** que se muestra

#### Opción B: Usar Google OAuth2 Playground

1. Ve a [Google OAuth2 Playground](https://developers.google.com/oauthplayground/)
2. Haz clic en el ícono de configuración (⚙️) en la esquina superior derecha
3. Marca "Use your own OAuth credentials"
4. Ingresa tu Client ID y Client Secret
5. En la lista de APIs, selecciona: `https://www.googleapis.com/auth/gmail.send`
6. Haz clic en "Authorize APIs"
7. Autoriza la aplicación
8. Haz clic en "Exchange authorization code for tokens"
9. Copia el **Refresh token**

### 5. Verificar Alias hello@tintum.app ✅

**Estado**: El alias `hello@tintum.app` ya está configurado en la cuenta `denis@tintum.app`.

Si necesitas verificar o configurar el alias:
1. Ve a [Google Admin Console](https://admin.google.com/)
2. Navega a: **Users** → Selecciona `denis@tintum.app` → **Email aliases**
3. Verifica que `hello@tintum.app` aparezca en la lista

**Nota**: El alias debe estar activo en Google Workspace para que funcione con Gmail API.

### 6. Configurar en Firebase Functions

Una vez que tengas:
- **Client ID**
- **Client Secret**
- **Refresh Token**
- **Email del remitente**: `hello@tintum.app` (alias)
- **Email OAuth**: `denis@tintum.app` (cuenta de autenticación)

Configúralos en Firebase:

```bash
cd /Users/denispaiva/proyectos/pinot

# Configurar credenciales OAuth2
firebase functions:config:set gmail.client_id="TU_CLIENT_ID"
firebase functions:config:set gmail.client_secret="TU_CLIENT_SECRET"
firebase functions:config:set gmail.refresh_token="TU_REFRESH_TOKEN"
firebase functions:config:set gmail.user="hello@tintum.app"
firebase functions:config:set gmail.oauth_email="denis@tintum.app"
```

**Importante**:
- `gmail.user`: Email remitente visible (`hello@tintum.app`)
- `gmail.oauth_email`: Email de la cuenta OAuth (`denis@tintum.app`)

### 6. Verificar Configuración

```bash
firebase functions:config:get
```

Deberías ver:
```json
{
  "gmail": {
    "client_id": "...",
    "client_secret": "...",
    "refresh_token": "...",
    "user": "hello@tintum.app",
    "oauth_email": "denis@tintum.app"
  }
}
```

### 7. Verificar Alias en OAuth Consent Screen

Asegúrate de que en el OAuth consent screen, el email de soporte sea `denis@tintum.app` (la cuenta principal), pero los emails se enviarán desde `hello@tintum.app`.

### 8. Instalar Dependencias y Desplegar

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

## ✅ Verificar que Funciona

1. Completa el formulario en `https://pinot.tintum.app/auth/signup-host-e.html`
2. Revisa tu bandeja de entrada (el email debe llegar desde `hello@tintum.app`)
3. Verifica que el remitente sea `hello@tintum.app` y no `denis@tintum.app`
4. Verifica los logs si no llega:
   ```bash
   firebase functions:log --only enviarEmailConfirmacion
   ```

## 🔒 Seguridad

- ✅ Las credenciales se almacenan encriptadas en Firebase Functions Config
- ✅ OAuth2 es más seguro que App Password
- ✅ Puedes revocar el acceso desde Google Cloud Console
- ✅ El refresh token no expira (a menos que lo revoques)

## 🚨 Troubleshooting

### Error: "invalid_grant"

- El refresh token puede haber expirado o sido revocado
- Genera un nuevo refresh token siguiendo el paso 4

### Error: "insufficient permissions"

- Verifica que el scope `gmail.send` esté habilitado
- Asegúrate de haber autorizado la aplicación correctamente

### Error: "access_denied"

- Verifica que el OAuth consent screen esté configurado
- Asegúrate de que el email `denis@tintum.app` tenga acceso
- Verifica que el alias `hello@tintum.app` esté configurado en Google Workspace

### Error: "Email enviado pero remitente incorrecto"

- Verifica que `hello@tintum.app` esté configurado como alias en Google Workspace
- Asegúrate de que `gmail.user` esté configurado como `hello@tintum.app`
- El alias debe estar activo y verificado en Google Workspace

### Email no llega

- Revisa la carpeta de spam
- Verifica que el email de destino sea válido
- Revisa los logs: `firebase functions:log`
- Verifica que el remitente (`gmail.user`) sea correcto

## 📊 Límites de Gmail API

- **Gratis**: 2,000 emails/día
- **Google Workspace Business**: 2,000 emails/día por usuario
- **Google Workspace Enterprise**: Sin límite práctico

Para volúmenes mayores, considera SendGrid, Mailgun o AWS SES.

## 🔄 Migración desde Nodemailer

Si ya tenías configurado Nodemailer:

1. ✅ El código ya está actualizado para usar Gmail API
2. ✅ Solo necesitas configurar las credenciales OAuth2
3. ✅ Las credenciales antiguas de SMTP ya no se usan
4. ✅ Puedes eliminar las configuraciones antiguas:
   ```bash
   firebase functions:config:unset email
   ```

---

**Última actualización**: Diciembre 2025



# 📧 Estructura Completa: Envío de Emails con Gmail API

## 🎯 Arquitectura General

```
┌─────────────────┐
│  Formulario Web │  (signup-host-e.html)
│  Frontend       │
└────────┬────────┘
         │
         │ 1. Usuario completa formulario
         │ 2. Valida con GeeTest CAPTCHA
         │ 3. Crea anfitrión en Firestore
         │
         ▼
┌─────────────────┐
│  Cloud Function │  (functions/index.js)
│  Backend        │
│  - Gmail API    │
│  - OAuth2       │
└────────┬────────┘
         │
         │ 4. Envía email usando Gmail API
         │
         ▼
┌─────────────────┐
│  Gmail API      │
│  Google Cloud   │
│  - OAuth2       │
│  - denis@...    │
└────────┬────────┘
         │
         │ 5. Email enviado desde hello@tintum.app
         │
         ▼
┌─────────────────┐
│  Buzón del      │
│  Usuario        │
└─────────────────┘
```

## 📁 Estructura de Archivos

### Frontend (Cliente)

```
web/
├── auth/
│   └── signup-host-e.html          # Formulario de alta de anfitrión
├── js/
│   ├── signup-host-e.js            # Lógica del formulario
│   │   ├── Validación de campos
│   │   ├── GeeTest CAPTCHA
│   │   ├── Crear anfitrión en Firestore
│   │   └── Llamar Cloud Function
│   └── core/
│       └── firebase-config.js      # Configuración Firebase
```

### Backend (Cloud Functions)

```
functions/
├── index.js                        # Cloud Function principal
│   ├── getGmailClient()            # Configurar OAuth2 para Gmail API
│   ├── enviarEmailConfirmacionAux() # Enviar email con Gmail API
│   └── exports.enviarEmailConfirmacion # HTTP Callable Function
└── package.json                    # Dependencias (googleapis)
```

### Configuración

```
.
├── firebase.json                   # Configuración Firebase Hosting/Functions
└── [documentación]
    ├── CONFIGURAR_GMAIL_API.md
    ├── GUIA_COMPLETA_OAUTH.md
    └── ESTRUCTURA_ENVIO_EMAILS.md (este archivo)
```

## 🔧 Componentes Necesarios

### 1. Credenciales OAuth2 en Google Cloud

**Ubicación**: Google Cloud Console → APIs & Services → Credentials

**Necesitas**:
- ✅ **Client ID**: `770959850208-esokfa5vilssj6agu9080onm0gmdefpe.apps.googleusercontent.com`
- ⏳ **Client Secret**: (necesitas revelarlo o regenerarlo)
- ✅ **Redirect URI**: `urn:ietf:wg:oauth:2.0:oob` (agregar al Web client)

**Configuración**:
1. Ve a: https://console.cloud.google.com/apis/credentials?project=pinot-tintum
2. Haz clic en "Web client (auto created by Google Service)"
3. En "Authorized redirect URIs", agrega: `urn:ietf:wg:oauth:2.0:oob`
4. Guarda

### 2. OAuth Consent Screen

**Ubicación**: Google Cloud Console → APIs & Services → OAuth consent screen

**Configuración necesaria**:
- ✅ App name: `Pinot Email Service`
- ✅ User support email: `denis@tintum.app`
- ✅ Scopes: `https://www.googleapis.com/auth/gmail.send`
- ⏳ Test users: `denis@tintum.app` (si está en modo Testing)

### 3. Refresh Token

**Cómo obtenerlo**:
1. Ejecuta: `cd functions && node get-token-web-client.js`
2. Autoriza la aplicación
3. Copia el Refresh Token

### 4. Configuración en Firebase Functions

```bash
firebase functions:config:set gmail.client_id="770959850208-esokfa5vilssj6agu9080onm0gmdefpe.apps.googleusercontent.com"
firebase functions:config:set gmail.client_secret="TU_CLIENT_SECRET"
firebase functions:config:set gmail.refresh_token="TU_REFRESH_TOKEN"
firebase functions:config:set gmail.user="hello@tintum.app"
firebase functions:config:set gmail.oauth_email="denis@tintum.app"
```

### 5. Alias de Email

**Ubicación**: Google Workspace Admin Console

**Configuración**:
- ✅ Alias `hello@tintum.app` ya configurado en `denis@tintum.app`

## 🔄 Flujo Completo

### Paso 1: Usuario Completa Formulario

**Archivo**: `web/auth/signup-host-e.html` + `web/js/signup-host-e.js`

```javascript
// Usuario ingresa nombre y email
// GeeTest CAPTCHA valida
// Se crea anfitrión en Firestore
// Se llama Cloud Function
```

### Paso 2: Frontend Llama Cloud Function

**Archivo**: `web/js/signup-host-e.js`

```javascript
import { getFunctions, httpsCallable } from 'firebase-functions.js';

const functions = getFunctions(app);
const enviarEmail = httpsCallable(functions, 'enviarEmailConfirmacion');

await enviarEmail({
  email: email,
  nombre: nombre,
  tokenVerificacion: tokenVerificacion,
  anfitrionId: docRef.id
});
```

### Paso 3: Cloud Function Procesa

**Archivo**: `functions/index.js`

```javascript
// 1. Obtiene credenciales OAuth2 desde Firebase Config
// 2. Configura cliente Gmail API con OAuth2
// 3. Construye email HTML
// 4. Envía usando Gmail API
// 5. Retorna resultado al frontend
```

### Paso 4: Gmail API Envía Email

**Desde**: `hello@tintum.app` (alias)
**Autenticación**: `denis@tintum.app` (cuenta OAuth2)
**Destino**: Email del usuario que se registró

## 📋 Checklist de Configuración

### Google Cloud Console

- [ ] Gmail API habilitada ✅
- [ ] OAuth Consent Screen configurado
  - [ ] App name configurado
  - [ ] Scopes: `gmail.send` agregado
  - [ ] Test users: `denis@tintum.app` agregado (si Testing)
- [ ] Credenciales OAuth2 creadas
  - [ ] Client ID obtenido ✅
  - [ ] Client Secret obtenido ⏳
  - [ ] Redirect URI `urn:ietf:wg:oauth:2.0:oob` agregado ⏳

### Firebase Functions

- [ ] Dependencias instaladas (`googleapis`)
- [ ] Refresh Token obtenido ⏳
- [ ] Configuración en Firebase Functions Config ⏳
  - [ ] `gmail.client_id`
  - [ ] `gmail.client_secret`
  - [ ] `gmail.refresh_token`
  - [ ] `gmail.user` = `hello@tintum.app`
  - [ ] `gmail.oauth_email` = `denis@tintum.app`
- [ ] Functions desplegadas

### Google Workspace

- [ ] Alias `hello@tintum.app` configurado ✅

### Frontend

- [ ] Formulario configurado ✅
- [ ] GeeTest CAPTCHA configurado ✅
- [ ] Llamada a Cloud Function implementada ✅

## 🔑 Credenciales Actuales

### Client ID (Web client automático)
```
770959850208-esokfa5vilssj6agu9080onm0gmdefpe.apps.googleusercontent.com
```

### Client Secret
```
⏳ Pendiente: Necesitas revelarlo o regenerarlo
```

### Refresh Token
```
⏳ Pendiente: Obtener después de configurar Client Secret
```

## 🚀 Próximos Pasos

1. **Revelar/Regenerar Client Secret** del Web client
2. **Agregar Redirect URI** `urn:ietf:wg:oauth:2.0:oob` al Web client
3. **Obtener Refresh Token** usando el script
4. **Configurar Firebase Functions** con todas las credenciales
5. **Desplegar Functions**
6. **Probar** el formulario completo

## 📝 Código Clave

### Frontend: Llamar Cloud Function

```javascript
// En signup-host-e.js
const enviarEmail = httpsCallable(functions, 'enviarEmailConfirmacion');
await enviarEmail({
  email: email,
  nombre: nombre,
  tokenVerificacion: tokenVerificacion,
  anfitrionId: anfitrionId
});
```

### Backend: Enviar Email con Gmail API

```javascript
// En functions/index.js
const { gmail, emailUser } = getGmailClient();
const encodedMessage = Buffer.from(message).toString('base64')...;
const response = await gmail.users.messages.send({
  userId: 'me',
  requestBody: { raw: encodedMessage }
});
```

## 🔒 Seguridad

- ✅ Credenciales almacenadas en Firebase Functions Config (encriptadas)
- ✅ OAuth2 más seguro que App Password
- ✅ Refresh Token no expira (a menos que se revoque)
- ✅ Alias `hello@tintum.app` para remitente profesional

---

**Última actualización**: Diciembre 2025

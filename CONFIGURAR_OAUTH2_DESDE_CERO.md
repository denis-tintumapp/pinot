# 🔐 Configuración OAuth2 desde Cero - Gmail API

## 🎯 Objetivo

Configurar envío de emails usando **Gmail API con OAuth2** (solo tokens, sin passwords).

## ✅ Verificación: Sin Passwords

El código actual **NO usa passwords**, solo tokens OAuth2:
- ✅ Client ID (público)
- ✅ Client Secret (token, no password)
- ✅ Refresh Token (token, no password)

## 📋 Estructura del Sistema

```
┌─────────────────────┐
│  Formulario Web     │  signup-host-e.html
│  (Frontend)         │
└──────────┬──────────┘
           │
           │ Usuario completa formulario
           │ ↓
           │ Frontend llama Cloud Function
           │
           ▼
┌─────────────────────┐
│  Cloud Function     │  functions/index.js
│  (Backend)          │
│  - OAuth2 Client    │
│  - Gmail API        │
└──────────┬──────────┘
           │
           │ Usa Refresh Token
           │ ↓
           │ Obtiene Access Token (automático)
           │ ↓
           │ Envía email con Gmail API
           │
           ▼
┌─────────────────────┐
│  Gmail API          │
│  (Google Cloud)     │
│  - OAuth2           │
└──────────┬──────────┘
           │
           │ Email enviado desde hello@tintum.app
           │
           ▼
┌─────────────────────┐
│  Buzón del Usuario  │
└─────────────────────┘
```

## 🔧 Componentes Necesarios

### 1. Google Cloud Project ✅

- **Proyecto**: `pinot-tintum`
- **Gmail API**: Habilitada ✅

### 2. OAuth2 Credentials

**Tipo**: Web Application

**Necesitas**:
- ✅ Client ID: `770959850208-esokfa5vilssj6agu9080onm0gmdefpe.apps.googleusercontent.com`
- ⏳ Client Secret: (revelar o regenerar)
- ⏳ Refresh Token: (obtener después)

### 3. OAuth Consent Screen

**Configuración**:
- App name: `Pinot Email Service`
- User support email: `denis@tintum.app`
- Scopes: `https://www.googleapis.com/auth/gmail.send`
- Test users: `denis@tintum.app` (si está en modo Testing)

### 4. Alias de Email ✅

- `hello@tintum.app` configurado como alias de `denis@tintum.app`

## 📝 Pasos de Configuración (Desde Cero)

### Paso 1: Configurar OAuth Consent Screen

1. **Inicia sesión** en: https://console.cloud.google.com
   - Email: `denis@tintum.app`
   - Selecciona proyecto: `pinot-tintum`

2. **Ve a OAuth Consent Screen**:
   - Menú (☰) → **APIs & Services** → **OAuth consent screen**
   - O URL directa: https://console.cloud.google.com/apis/credentials/consent?project=pinot-tintum

3. **Configura**:
   - **App name**: `Pinot Email Service`
   - **User support email**: `denis@tintum.app`
   - **Scopes**: Agrega `https://www.googleapis.com/auth/gmail.send`
   - **Test users** (si está en Testing): Agrega `denis@tintum.app`
   - **Guarda**

### Paso 2: Configurar Web Client OAuth2

1. **Ve a Credentials**:
   - Menú (☰) → **APIs & Services** → **Credentials**
   - O URL: https://console.cloud.google.com/apis/credentials?project=pinot-tintum

2. **Usa el Web client automático**:
   - Busca: **"Web client (auto created by Google Service)"**
   - Client ID: `770959850208-esokfa5vilssj6agu9080onm0gmdefpe.apps.googleusercontent.com`

3. **Agrega Redirect URI**:
   - Haz clic en el Web client
   - En **"Authorized redirect URIs"**, haz clic en **"ADD URI"**
   - Agrega: `urn:ietf:wg:oauth:2.0:oob`
   - **Guarda**

4. **Obtén Client Secret**:
   - En la misma página, busca **"Client secret"**
   - Si está oculto, haz clic en el ícono de ojo 👁️ para revelarlo
   - O haz clic en **"Reset secret"** para generar uno nuevo
   - **Copia el Client Secret** (formato: `GOCSPX-...`)

### Paso 3: Obtener Refresh Token

1. **Actualiza el script con el Client Secret**:
   ```bash
   cd /Users/denispaiva/proyectos/pinot/functions
   ```

2. **Edita `get-token-web-client.js`** y reemplaza:
   ```javascript
   const CLIENT_SECRET = 'TU_CLIENT_SECRET_AQUI';
   ```
   Con tu Client Secret real.

3. **Ejecuta el script**:
   ```bash
   npm install googleapis
   node get-token-web-client.js
   ```

4. **Sigue las instrucciones**:
   - Abre la URL que se muestra
   - Autoriza la aplicación
   - Copia el código de autorización
   - Pégalo en la terminal
   - **Copia el Refresh Token** que se muestra

### Paso 4: Configurar Firebase Functions

```bash
cd /Users/denispaiva/proyectos/pinot

firebase functions:config:set gmail.client_id="770959850208-esokfa5vilssj6agu9080onm0gmdefpe.apps.googleusercontent.com"
firebase functions:config:set gmail.client_secret="TU_CLIENT_SECRET"
firebase functions:config:set gmail.refresh_token="TU_REFRESH_TOKEN"
firebase functions:config:set gmail.user="hello@tintum.app"
firebase functions:config:set gmail.oauth_email="denis@tintum.app"
```

**Reemplaza**:
- `TU_CLIENT_SECRET` con el Client Secret obtenido
- `TU_REFRESH_TOKEN` con el Refresh Token obtenido

### Paso 5: Verificar Configuración

```bash
firebase functions:config:get
```

Deberías ver:
```json
{
  "gmail": {
    "client_id": "770959850208-esokfa5vilssj6agu9080onm0gmdefpe.apps.googleusercontent.com",
    "client_secret": "GOCSPX-...",
    "refresh_token": "...",
    "user": "hello@tintum.app",
    "oauth_email": "denis@tintum.app"
  }
}
```

### Paso 6: Instalar Dependencias y Desplegar

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

## 🔒 Seguridad OAuth2

### ✅ Lo que se almacena (seguro)

- **Client ID**: Público, seguro
- **Client Secret**: Token OAuth2, encriptado en Firebase
- **Refresh Token**: Token OAuth2, encriptado en Firebase
- **NO passwords**: Solo tokens

### 🔄 Renovación Automática

- **Access Token**: Se renueva automáticamente usando Refresh Token
- **Refresh Token**: No expira (a menos que se revoque)
- **Sin intervención manual**: Todo es automático

## 📊 Flujo Completo

```
1. Usuario completa formulario (signup-host-e.html)
   ↓
2. Frontend valida con GeeTest CAPTCHA
   ↓
3. Frontend crea anfitrión en Firestore
   ↓
4. Frontend llama Cloud Function: enviarEmailConfirmacion
   ↓
5. Cloud Function usa Refresh Token para obtener Access Token
   ↓
6. Cloud Function envía email con Gmail API
   ↓
7. Email enviado desde hello@tintum.app
   ↓
8. Email llega al usuario
```

## 🎯 Estado Actual

### ✅ Completado

- ✅ Código usando OAuth2 (sin passwords)
- ✅ Gmail API habilitada
- ✅ Client ID obtenido
- ✅ Alias hello@tintum.app configurado
- ✅ Cloud Function implementada

### ⏳ Pendiente

- ⏳ Client Secret (revelar o regenerar)
- ⏳ Redirect URI agregado al Web client
- ⏳ Refresh Token obtenido
- ⏳ Configuración en Firebase Functions
- ⏳ Despliegue

## 📝 Archivos Clave

### Frontend
- `web/auth/signup-host-e.html` - Formulario
- `web/js/signup-host-e.js` - Lógica (llama Cloud Function)

### Backend
- `functions/index.js` - Cloud Function (usa Gmail API con OAuth2)
- `functions/package.json` - Dependencias (googleapis)

### Scripts
- `functions/get-token-web-client.js` - Obtener Refresh Token

---

**Última actualización**: Diciembre 2025

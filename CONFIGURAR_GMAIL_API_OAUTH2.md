# 🔐 Configuración Gmail API con OAuth2 (Desde Cero)

## 🎯 Objetivo

Configurar envío de emails usando **Gmail API con OAuth2** (sin passwords, solo tokens).

## ✅ Ventajas de OAuth2

- ✅ **Sin passwords**: Solo tokens (más seguro)
- ✅ **Refresh Token**: No expira (a menos que se revoque)
- ✅ **Mejor seguridad**: Tokens específicos por aplicación
- ✅ **Revocable**: Puedes revocar acceso desde Google Cloud Console

## 📋 Estructura del Sistema

```
Frontend (Formulario)
    ↓
Cloud Function (Backend)
    ↓
Gmail API (OAuth2)
    ↓
Email enviado desde hello@tintum.app
```

## 🔧 Componentes Necesarios

### 1. Google Cloud Project

- ✅ Proyecto: `pinot-tintum`
- ✅ Gmail API: Habilitada ✅

### 2. OAuth2 Credentials

**Tipo**: Web Application (no Desktop app)

**Necesitas**:
- Client ID
- Client Secret
- Refresh Token (se obtiene después)

### 3. OAuth Consent Screen

**Configuración**:
- App name: `Pinot Email Service`
- User support email: `denis@tintum.app`
- Scopes: `https://www.googleapis.com/auth/gmail.send`
- Test users: `denis@tintum.app` (si está en Testing)

### 4. Alias de Email

- ✅ `hello@tintum.app` configurado como alias de `denis@tintum.app`

## 📝 Pasos de Configuración

### Paso 1: Verificar/Crear OAuth2 Credentials

1. Ve a: https://console.cloud.google.com/apis/credentials?project=pinot-tintum

2. **Opción A: Usar Web client automático** (recomendado)
   - Busca: "Web client (auto created by Google Service)"
   - Client ID: `770959850208-esokfa5vilssj6agu9080onm0gmdefpe.apps.googleusercontent.com`
   - Client Secret: (revelar o regenerar)

3. **Opción B: Crear nuevo OAuth2 Client**
   - Create Credentials → OAuth client ID
   - Application type: **Web application**
   - Name: `Pinot Gmail API Web`
   - Authorized redirect URIs: `urn:ietf:wg:oauth:2.0:oob`
   - Create

### Paso 2: Configurar OAuth Consent Screen

1. Ve a: https://console.cloud.google.com/apis/credentials/consent?project=pinot-tintum

2. Configura:
   - App name: `Pinot Email Service`
   - User support email: `denis@tintum.app`
   - Scopes: Agrega `gmail.send`
   - Test users: Agrega `denis@tintum.app` (si Testing)

3. Guarda

### Paso 3: Obtener Refresh Token

**Método 1: Script Node.js** (Recomendado)

```bash
cd /Users/denispaiva/proyectos/pinot/functions
npm install googleapis
node get-token-web-client.js
```

**Método 2: Google OAuth2 Playground**

1. Ve a: https://developers.google.com/oauthplayground/
2. Configuración (⚙️) → Use your own OAuth credentials
3. Ingresa Client ID y Secret
4. Selecciona scope: `gmail.send`
5. Autoriza y obtén Refresh Token

### Paso 4: Configurar Firebase Functions (Solo Tokens)

```bash
cd /Users/denispaiva/proyectos/pinot

firebase functions:config:set gmail.client_id="TU_CLIENT_ID"
firebase functions:config:set gmail.client_secret="TU_CLIENT_SECRET"
firebase functions:config:set gmail.refresh_token="TU_REFRESH_TOKEN"
firebase functions:config:set gmail.user="hello@tintum.app"
firebase functions:config:set gmail.oauth_email="denis@tintum.app"
```

**⚠️ Importante**: Solo tokens, NO passwords.

### Paso 5: Verificar Configuración

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

### Paso 6: Instalar Dependencias y Desplegar

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

## 🔒 Seguridad

### ✅ Lo que SÍ se almacena (seguro)

- **Client ID**: Público, seguro de compartir
- **Client Secret**: Encriptado en Firebase Functions Config
- **Refresh Token**: Encriptado en Firebase Functions Config
- **No passwords**: Solo tokens OAuth2

### ❌ Lo que NO se almacena

- ❌ Passwords de cuenta
- ❌ App Passwords
- ❌ Credenciales SMTP

## 📊 Flujo OAuth2

```
1. Usuario completa formulario
   ↓
2. Frontend llama Cloud Function
   ↓
3. Cloud Function usa Refresh Token
   ↓
4. Gmail API obtiene Access Token (automático)
   ↓
5. Gmail API envía email
   ↓
6. Email llega al usuario
```

## 🔄 Renovación de Tokens

- **Access Token**: Se renueva automáticamente usando Refresh Token
- **Refresh Token**: No expira (a menos que se revoque)
- **Revocación**: Desde Google Cloud Console → Credentials

## 🚨 Troubleshooting

### Error: "invalid_grant"

- El Refresh Token fue revocado o expiró
- Solución: Obtener nuevo Refresh Token

### Error: "insufficient permissions"

- Scope `gmail.send` no autorizado
- Solución: Verificar OAuth Consent Screen

### Error: "access_denied"

- Test user no agregado (si está en Testing)
- Solución: Agregar `denis@tintum.app` como test user

## 📝 Resumen de Credenciales

### Actual (Web client automático)

- **Client ID**: `770959850208-esokfa5vilssj6agu9080onm0gmdefpe.apps.googleusercontent.com`
- **Client Secret**: ⏳ Pendiente (revelar o regenerar)
- **Refresh Token**: ⏳ Pendiente (obtener después de configurar)

### Configuración Firebase

```bash
# Solo estos 5 valores (todos tokens, sin passwords)
gmail.client_id
gmail.client_secret
gmail.refresh_token
gmail.user="hello@tintum.app"
gmail.oauth_email="denis@tintum.app"
```

---

**Última actualización**: Diciembre 2025

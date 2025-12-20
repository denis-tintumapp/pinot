# 📧 Configurar Remitente con Nodemailer

## 🎯 Configuración del Remitente

Con Nodemailer, el remitente se configura en el campo `from` del objeto `mailOptions`.

## 📝 Configuración Actual

El código ya está configurado para usar `hello@tintum.app` como remitente:

```javascript
const mailOptions = {
  from: `"Pinot" <hello@tintum.app>`, // Remitente visible
  replyTo: 'hello@tintum.app',        // Reply-To
  to: email,
  subject: '...',
  html: '...'
};
```

## ✅ Cómo Funciona

### 1. Autenticación SMTP

- **Usuario SMTP**: `denis@tintum.app` (cuenta de autenticación)
- **Password**: App Password de Google
- **Host**: `smtp.gmail.com`
- **Port**: `587`

### 2. Remitente Visible

- **From**: `hello@tintum.app` (alias configurado en Google Workspace)
- **Reply-To**: `hello@tintum.app`

### 3. Configuración en Firebase Functions

```bash
firebase functions:config:set email.user="denis@tintum.app"
firebase functions:config:set email.password="TU_APP_PASSWORD"
firebase functions:config:set email.host="smtp.gmail.com"
firebase functions:config:set email.port="587"
firebase functions:config:set email.from="hello@tintum.app"
```

## 🔍 Verificación

El campo `from` en `mailOptions` es lo que el destinatario verá como remitente. Aunque la autenticación SMTP use `denis@tintum.app`, el email se enviará desde `hello@tintum.app` porque:

1. El alias `hello@tintum.app` está configurado en Google Workspace
2. El campo `from` en el email especifica `hello@tintum.app`
3. Google Workspace permite enviar desde alias si están configurados

## 📋 Estructura del mailOptions

```javascript
const mailOptions = {
  from: `"Nombre Mostrado" <email@dominio.com>`, // Remitente visible
  replyTo: 'email@dominio.com',                 // Email para respuestas
  to: 'destinatario@email.com',                  // Destinatario
  subject: 'Asunto del email',                   // Asunto
  html: '<html>...</html>',                     // Contenido HTML
  text: 'Texto plano'                            // Contenido texto plano
};
```

## 🎯 Para Cambiar el Remitente

Si quieres cambiar el remitente a otro alias o email:

1. **Configurar en Firebase Functions**:
   ```bash
   firebase functions:config:set email.from="nuevo-remitente@tintum.app"
   ```

2. **O modificar directamente en el código**:
   ```javascript
   const fromEmail = 'nuevo-remitente@tintum.app';
   const mailOptions = {
     from: `"Pinot" <${fromEmail}>`,
     // ...
   };
   ```

## ⚠️ Importante

- El alias `hello@tintum.app` debe estar configurado en Google Workspace
- La cuenta de autenticación (`denis@tintum.app`) debe tener permisos para enviar desde el alias
- El App Password debe ser de la cuenta `denis@tintum.app`

## 🔄 Comparación: Nodemailer vs Gmail API

| Característica | Nodemailer (SMTP) | Gmail API |
|---------------|-------------------|-----------|
| **Configuración** | Más simple | Más compleja (OAuth2) |
| **Remitente** | Campo `from` en mailOptions | Campo `From` en mensaje RFC 2822 |
| **Límite diario** | 500-2000 emails | 2000 emails |
| **Autenticación** | App Password | OAuth2 Refresh Token |

---

**Última actualización**: Diciembre 2025

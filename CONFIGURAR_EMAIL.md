# 📧 Configuración de Envío de Emails

## 📋 Resumen

Guía para configurar el envío de emails de confirmación para anfitriones en Pinot usando Firebase Cloud Functions.

## 🔧 Configuración Requerida

### 1. Instalar Dependencias

```bash
cd functions
npm install
```

### 2. Configurar Credenciales de Email (Google Workspace)

Para usar tu cuenta de Google Workspace `denis@tintum.app`:

#### Opción A: App Password (Recomendado para Google Workspace)

1. Ve a tu [Cuenta de Google](https://myaccount.google.com/) con `denis@tintum.app`
2. Seguridad → Verificación en 2 pasos (debe estar activada)
3. Contraseñas de aplicaciones
4. Genera una nueva contraseña para "Correo" o "Otra aplicación"
5. Copia la contraseña generada (16 caracteres sin espacios)

Luego configura en Firebase:

```bash
firebase functions:config:set email.user="denis@tintum.app"
firebase functions:config:set email.password="xxxx xxxx xxxx xxxx"
firebase functions:config:set email.host="smtp.gmail.com"
firebase functions:config:set email.port="587"
```

**Nota**: Si la App Password tiene espacios, quítalos o usa comillas.

#### Opción B: OAuth2 (Más seguro, pero más complejo)

Para producción, puedes configurar OAuth2. Ver sección "OAuth2 para Google Workspace" más abajo.

#### Opción C: Variables de Entorno (Para desarrollo local)

Crea un archivo `.env` en la carpeta `functions/`:

```env
EMAIL_USER=denis@tintum.app
EMAIL_PASSWORD=tu-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

### 4. Desplegar Cloud Functions

```bash
firebase deploy --only functions
```

## 📧 Configuración para Google Workspace (denis@tintum.app)

### Configuración Básica con App Password

```bash
# Configurar credenciales
firebase functions:config:set email.user="denis@tintum.app"
firebase functions:config:set email.password="TU_APP_PASSWORD_AQUI"
firebase functions:config:set email.host="smtp.gmail.com"
firebase functions:config:set email.port="587"
```

### Obtener App Password

1. Inicia sesión en [Google Account](https://myaccount.google.com/) con `denis@tintum.app`
2. Ve a **Seguridad**
3. Activa **Verificación en 2 pasos** (si no está activada)
4. Ve a **Contraseñas de aplicaciones**
5. Selecciona **Correo** y **Otro (nombre personalizado)**
6. Ingresa "Pinot Cloud Functions" como nombre
7. Genera y copia la contraseña (16 caracteres)
8. Úsala en la configuración de Firebase

### Verificar Configuración

```bash
# Ver configuración actual
firebase functions:config:get
```

Deberías ver:
```json
{
  "email": {
    "user": "denis@tintum.app",
    "password": "xxxx",
    "host": "smtp.gmail.com",
    "port": "587"
  }
}
```

## 📧 Otros Proveedores de Email Soportados

### Gmail Personal

```javascript
host: 'smtp.gmail.com'
port: 587
secure: false
```

### SendGrid

```bash
firebase functions:config:set email.user="apikey"
firebase functions:config:set email.password="SG.xxxxx"
firebase functions:config:set email.host="smtp.sendgrid.net"
firebase functions:config:set email.port="587"
```

### Mailgun

```bash
firebase functions:config:set email.user="postmaster@mg.tudominio.com"
firebase functions:config:set email.password="xxxxx"
firebase functions:config:set email.host="smtp.mailgun.org"
firebase functions:config:set email.port="587"
```

### Otros SMTP

Cualquier servidor SMTP estándar funcionará. Solo ajusta:
- `host`: Servidor SMTP
- `port`: Puerto (587 para TLS, 465 para SSL)
- `secure`: true para SSL, false para TLS

## 🔍 Verificar Configuración

### Ver configuración actual:

```bash
firebase functions:config:get
```

### Probar envío de email:

1. Completa el formulario de alta en `signup-host-e.html`
2. Revisa los logs de Cloud Functions:
   ```bash
   firebase functions:log
   ```
3. Verifica tu bandeja de entrada

## 🚨 Troubleshooting

### Error: "Email credentials not configured"

- Verifica que hayas configurado las variables con `firebase functions:config:set`
- Asegúrate de haber desplegado las funciones después de configurar

### Error: "Invalid login"

- Verifica que el email y contraseña sean correctos
- Si usas Gmail, asegúrate de usar una App Password, no tu contraseña normal
- Verifica que la verificación en 2 pasos esté activada (Gmail)

### Error: "Connection timeout"

- Verifica que el puerto y host sean correctos
- Revisa el firewall de tu red
- Prueba con otro proveedor de email

### Email no llega

- Revisa la carpeta de spam
- Verifica los logs de Cloud Functions
- Asegúrate de que el email de destino sea válido

## 📝 Estructura del Email

El email incluye:
- Header con logo y frase de Pinot
- Mensaje de bienvenida personalizado
- Botón de confirmación
- Link de respaldo
- Información de expiración (7 días)

## 🔄 Flujo Completo

1. Usuario completa formulario de alta
2. Se crea documento en Firestore (`anfitriones`)
3. Se llama a Cloud Function `enviarEmailConfirmacion`
4. Cloud Function envía email con link de verificación
5. Usuario hace clic en el link
6. (Futuro) Página de verificación valida token y marca email como verificado

## 🔐 Seguridad

- Las credenciales se almacenan en Firebase Functions Config (encriptado)
- El token de verificación es único y aleatorio
- El link expira después de 7 días
- Solo el email registrado puede verificar la cuenta

## 📊 Monitoreo

Revisa los logs de Cloud Functions:

```bash
# Ver todos los logs
firebase functions:log

# Ver logs en tiempo real
firebase functions:log --follow

# Ver logs de una función específica
firebase functions:log --only enviarEmailConfirmacion
```

---

**Última actualización**: Diciembre 2025



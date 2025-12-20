# 📧 Configuración de Email con Google Workspace

## 🎯 Configuración para denis@tintum.app

Guía específica para configurar el envío de emails usando tu cuenta de Google Workspace.

## 📝 Pasos Rápidos

### 1. Obtener App Password

1. Ve a [Google Account](https://myaccount.google.com/) e inicia sesión con `denis@tintum.app`
2. Navega a **Seguridad** → **Verificación en 2 pasos**
3. Asegúrate de que la verificación en 2 pasos esté **activada**
4. Ve a **Contraseñas de aplicaciones** (o busca "App passwords")
5. Selecciona:
   - **Aplicación**: Correo
   - **Dispositivo**: Otro (nombre personalizado)
   - **Nombre**: `Pinot Cloud Functions`
6. Haz clic en **Generar**
7. **Copia la contraseña de 16 caracteres** (formato: `xxxx xxxx xxxx xxxx`)

### 2. Configurar en Firebase

```bash
cd /Users/denispaiva/proyectos/pinot

# Configurar credenciales
firebase functions:config:set email.user="denis@tintum.app"
firebase functions:config:set email.password="TU_APP_PASSWORD_AQUI"
firebase functions:config:set email.host="smtp.gmail.com"
firebase functions:config:set email.port="587"
```

**Importante**: 
- Reemplaza `TU_APP_PASSWORD_AQUI` con la contraseña de 16 caracteres que copiaste
- Si tiene espacios, puedes dejarlos o quitarlos (ambos funcionan)

### 3. Verificar Configuración

```bash
firebase functions:config:get
```

Deberías ver algo como:
```json
{
  "email": {
    "user": "denis@tintum.app",
    "password": "xxxx xxxx xxxx xxxx",
    "host": "smtp.gmail.com",
    "port": "587"
  }
}
```

### 4. Instalar Dependencias y Desplegar

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

## ✅ Verificar que Funciona

1. Completa el formulario en `https://pinot.tintum.app/auth/signup-host-e.html`
2. Revisa tu bandeja de entrada en `denis@tintum.app`
3. Verifica los logs si no llega:
   ```bash
   firebase functions:log --only enviarEmailConfirmacion
   ```

## 🔒 Seguridad

- ✅ Las credenciales se almacenan encriptadas en Firebase
- ✅ App Password es más seguro que usar tu contraseña principal
- ✅ Puedes revocar el App Password en cualquier momento
- ✅ El App Password solo funciona para SMTP, no para acceso completo

## 🚨 Troubleshooting

### Error: "Invalid login"

- Verifica que la App Password sea correcta (16 caracteres)
- Asegúrate de que la verificación en 2 pasos esté activada
- Intenta generar una nueva App Password

### Error: "Connection timeout"

- Verifica que `smtp.gmail.com` y puerto `587` sean correctos
- Revisa el firewall de tu red
- Prueba con otro proveedor SMTP si persiste

### Email no llega

- Revisa la carpeta de spam
- Verifica que el email de destino sea válido
- Revisa los logs: `firebase functions:log`

## 📊 Límites de Google Workspace

- **Gratis**: 500 emails/día
- **Google Workspace Business**: 2,000 emails/día
- **Google Workspace Enterprise**: Sin límite práctico

Para volúmenes mayores, considera SendGrid o Mailgun.

---

**Última actualización**: Diciembre 2025



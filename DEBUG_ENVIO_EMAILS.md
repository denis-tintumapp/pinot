# 🔍 Debug: Envío de Emails

## 📋 Checklist de Verificación

### ✅ Configuración Verificada

- [x] Gmail API habilitada
- [x] OAuth2 Client ID configurado
- [x] OAuth2 Client Secret configurado
- [x] Refresh Token configurado
- [x] Remitente: `hello@tintum.app`
- [x] OAuth Account: `denis@tintum.app`

### 🔍 Pasos para Diagnosticar

1. **Completa el formulario de alta** en:
   ```
   https://pinot.tintum.app/auth/signup-host-e
   ```

2. **Abre la consola del navegador** (F12) y revisa:
   - ¿Aparece "Llamando a Cloud Function para enviar email..."?
   - ¿Aparece "Email de confirmación enviado exitosamente"?
   - ¿Hay algún error en rojo?

3. **Revisa los logs de Firebase Functions**:
   ```bash
   firebase functions:log
   ```
   
   Busca mensajes que contengan:
   - "📧 Iniciando envío de email"
   - "📧 Resultado del envío"
   - "Error al enviar email"

## 🚨 Posibles Problemas

### 1. Error: "Gmail API no configurado"

**Síntoma**: En logs aparece "⚠️ Gmail API credentials not configured"

**Solución**: Verificar que todas las credenciales estén configuradas:
```bash
firebase functions:config:get
```

### 2. Error: "invalid_grant" o "Token expired"

**Síntoma**: Error de autenticación OAuth2

**Solución**: El Refresh Token expiró o fue revocado. Necesitas obtener uno nuevo.

### 3. Error: "insufficient permissions"

**Síntoma**: No tiene permisos para enviar emails

**Solución**: Verificar que el scope `gmail.send` esté autorizado en OAuth Consent Screen.

### 4. Email no llega pero no hay errores

**Posibles causas**:
- Email en spam/correo no deseado
- Dominio bloqueado por el proveedor de email
- Delay en la entrega

**Solución**: 
- Revisar carpeta de spam
- Verificar logs de Gmail API (debería mostrar messageId)

## 📊 Verificar en Gmail

1. **Revisa la cuenta `denis@tintum.app`**:
   - Ve a: https://mail.google.com
   - Busca emails enviados desde `hello@tintum.app`

2. **Revisa logs de Gmail API**:
   - Los logs de Firebase Functions deberían mostrar el `messageId`
   - Puedes buscar ese ID en Gmail para verificar que se envió

## 🔧 Prueba Manual

Para probar el envío de email directamente:

1. **Abre la consola del navegador** en la página de signup
2. **Ejecuta**:
   ```javascript
   const functions = getFunctions();
   const enviarEmail = httpsCallable(functions, 'enviarEmailConfirmacion');
   enviarEmail({
     email: 'tu-email@ejemplo.com',
     nombre: 'Test',
     tokenVerificacion: 'test-token',
     anfitrionId: 'test-id'
   }).then(result => console.log('Resultado:', result))
     .catch(error => console.error('Error:', error));
   ```

---

**Última actualización**: Diciembre 2025

# 🔧 Configurar Invoker para Función HTTP

## Problema

La función HTTP `enviarEmailConfirmacionHTTP` requiere permisos de invoker público para ser accesible a través del rewrite de Firebase Hosting.

## Solución: Configurar Invoker Público

### Opción 1: Desde Google Cloud Console (Recomendado)

1. **Accede a Cloud Functions**:
   - Ve a: https://console.cloud.google.com/cloudfunctions/list?project=pinot-tintum
   - O busca "Cloud Functions" en la consola

2. **Encuentra la función**:
   - Busca `enviarEmailConfirmacionHTTP`
   - Haz clic en el nombre de la función

3. **Configurar permisos**:
   - Haz clic en la pestaña **"PERMISSIONS"** (Permisos)
   - Haz clic en **"ADD PRINCIPAL"** (Agregar principal)
   - En **"New principals"**, ingresa: `allUsers`
   - En **"Select a role"**, selecciona: **"Cloud Functions Invoker"**
   - Haz clic en **"SAVE"**

### Opción 2: Desde la Línea de Comandos

```bash
# 1. Autenticarse con gcloud
gcloud auth login

# 2. Configurar el proyecto
gcloud config set project pinot-tintum

# 3. Agregar permisos de invoker público
gcloud functions add-iam-policy-binding enviarEmailConfirmacionHTTP \
  --region=us-central1 \
  --member=allUsers \
  --role=roles/cloudfunctions.invoker \
  --project=pinot-tintum
```

### Opción 3: Desde Firebase Console

1. Ve a: https://console.firebase.google.com/project/pinot-tintum/functions
2. Busca `enviarEmailConfirmacionHTTP`
3. Haz clic en los tres puntos (⋮) → **"View in Cloud Console"**
4. Sigue los pasos de la Opción 1

## Verificación

Después de configurar el invoker, verifica que funciona:

1. **Prueba el endpoint directamente**:
   ```bash
   curl -X POST https://pinot.tintum.app/api/enviarEmailConfirmacion \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","nombre":"Test","tokenVerificacion":"test"}'
   ```

2. **O prueba desde el formulario**:
   - Ve a: `https://pinot.tintum.app/auth/signup-host-e`
   - Completa el formulario
   - Verifica que no haya errores de CORS

## Seguridad

⚠️ **Nota de Seguridad**: Hacer la función pública (`allUsers`) permite que cualquiera la llame. Sin embargo:

- La función valida los datos de entrada
- Requiere `email`, `nombre` y `tokenVerificacion` válidos
- Valida reCAPTCHA si se proporciona
- Solo envía emails a direcciones válidas

Para mayor seguridad en producción, considera:
- Implementar rate limiting
- Agregar validación adicional de tokens
- Usar Firebase Authentication para restringir acceso

## Troubleshooting

### Error: "Permission denied"

Si ves un error de permisos:

1. Verifica que el invoker esté configurado:
   ```bash
   gcloud functions get-iam-policy enviarEmailConfirmacionHTTP \
     --region=us-central1 \
     --project=pinot-tintum
   ```

2. Deberías ver `allUsers` con rol `roles/cloudfunctions.invoker`

### Error: "Function not found"

Si la función no existe:

1. Verifica que esté desplegada:
   ```bash
   firebase functions:list
   ```

2. Si no existe, despliégala:
   ```bash
   firebase deploy --only functions
   ```

---

**Última actualización**: Diciembre 2025

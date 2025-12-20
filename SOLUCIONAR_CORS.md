# 🔧 Solución de Problemas de CORS

## Problema

Error de CORS al llamar a la función callable `enviarEmailConfirmacion` desde `https://pinot.tintum.app`.

## Soluciones Implementadas

### 1. Función Callable (Principal)

La función callable (`enviarEmailConfirmacion`) maneja CORS automáticamente. Si persiste el error, puede ser por:

- **Dominio no configurado**: Verifica que `pinot.tintum.app` esté correctamente configurado en Firebase Hosting
- **Cache del navegador**: Limpia la caché y prueba en modo incógnito
- **Configuración de Firebase**: Verifica que el dominio esté autorizado

### 2. Función HTTP Alternativa (Backup)

Se creó una función HTTP alternativa (`enviarEmailConfirmacionHTTP`) que requiere configuración manual del invoker.

#### Configurar Invoker Manualmente

Ejecuta este comando para hacer la función HTTP pública:

```bash
gcloud functions add-iam-policy-binding enviarEmailConfirmacionHTTP \
  --region=us-central1 \
  --member=allUsers \
  --role=roles/cloudfunctions.invoker \
  --project=pinot-tintum
```

**Nota**: Requiere autenticación con `gcloud auth login` y permisos de administrador.

### 3. Verificar Configuración del Dominio

1. Ve a [Firebase Console](https://console.firebase.google.com/project/pinot-tintum/hosting)
2. Verifica que `pinot.tintum.app` esté en la lista de dominios personalizados
3. Asegúrate de que el dominio tenga el certificado SSL activo

### 4. Solución Temporal

Si el problema persiste, puedes:

1. **Usar el dominio por defecto temporalmente**:
   - `https://pinot-tintum.web.app/auth/signup-host-e.html`
   - Las funciones callable funcionan correctamente desde este dominio

2. **Verificar logs de la función**:
   ```bash
   firebase functions:log --only enviarEmailConfirmacion
   ```

## Estado Actual

- ✅ Función callable configurada correctamente
- ✅ Función HTTP alternativa creada (requiere configuración de invoker)
- ✅ Frontend configurado para usar función callable
- ⚠️ Función HTTP requiere permisos de administrador para configurar invoker

## Próximos Pasos

1. Verificar que el dominio personalizado esté correctamente configurado
2. Si persiste el error, configurar el invoker de la función HTTP manualmente
3. Revisar logs de Firebase Functions para más detalles

---

**Última actualización**: Diciembre 2025

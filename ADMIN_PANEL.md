# 🔐 Panel de Administración de Pinot

## 📋 Descripción

Panel web para gestionar usuarios (anfitriones y participantes) de la aplicación Pinot. Acceso restringido a superusuario.

## 🔗 URL

```
https://pinot.tintum.app/admin.html
```

## 🔑 Autenticación

### Contraseña de Superusuario

**Contraseña por defecto**: `admin`

⚠️ **IMPORTANTE**: Cambia esta contraseña en producción. La contraseña está hasheada con SHA-256 en el código.

### Cambiar la Contraseña

1. **Obtener hash SHA-256 de la nueva contraseña**:
   ```javascript
   // En la consola del navegador o usando Node.js:
   const crypto = require('crypto');
   const hash = crypto.createHash('sha256').update('tu-nueva-contraseña').digest('hex');
   console.log(hash);
   ```

2. **Actualizar en el código**:
   - Editar `/web/js/admin-panel.js`
   - Buscar `ADMIN_PASSWORD_HASH`
   - Reemplazar con el nuevo hash

3. **Alternativa más segura** (recomendado para producción):
   - Almacenar la contraseña en Secret Manager
   - O usar Firebase Authentication con roles personalizados
   - O implementar autenticación con email/password para admin

## 📊 Funcionalidades

### Gestión de Anfitriones

- **Ver lista completa** de anfitriones
- **Filtrar por tipo**: Efímeros o Persistentes
- **Buscar** por nombre o email
- **Ver detalles** de cada anfitrión
- **Eliminar** anfitriones

**Información mostrada**:
- ID del anfitrión
- Nombre
- Email
- Tipo (Efímero/Persistente)
- Estado de verificación de email
- Cantidad de eventos creados
- Fecha de creación
- Último acceso

### Gestión de Participantes

- **Ver lista completa** de participantes
- **Buscar** por nombre o ID de evento
- **Eliminar** participantes

**Información mostrada**:
- ID del participante
- Nombre
- ID del evento asociado
- Fecha de creación

## 🛡️ Seguridad

### Reglas de Firestore

Las reglas actuales permiten:
- ✅ **Lectura** de anfitriones y participantes (público)
- ✅ **Creación** de anfitriones (público, para signup)
- ❌ **Eliminación** desde el cliente (solo desde admin panel con autenticación)

### Mejoras de Seguridad Recomendadas

1. **Implementar Firebase Authentication**:
   - Crear usuarios admin en Firebase Auth
   - Usar Custom Claims para roles
   - Actualizar reglas de Firestore para verificar claims

2. **Cloud Functions para operaciones sensibles**:
   - Mover eliminaciones a Cloud Functions
   - Validar permisos en el backend
   - Registrar todas las operaciones de admin

3. **Rate Limiting**:
   - Limitar intentos de login
   - Implementar CAPTCHA en login de admin

4. **Auditoría**:
   - Registrar todas las acciones de admin
   - Guardar logs en Firestore o Cloud Logging

## 🔧 Configuración

### Estructura de Datos

#### Anfitriones (`anfitriones`)
```javascript
{
  tipo: 'efimero' | 'persistente',
  sesionId: string,
  nombreAnfitrion: string,
  email: string,
  emailVerificado: boolean,
  tokenVerificacion: string,
  creadoEn: Timestamp,
  ultimoAcceso: Timestamp,
  eventosCreados: number
}
```

#### Participantes (`participantes`)
```javascript
{
  eventoId: string,
  nombre: string,
  creadoEn: Timestamp
}
```

## 🚀 Despliegue

```bash
cd /Users/denispaiva/proyectos/pinot
firebase deploy --only hosting
```

## 📝 Notas

- El panel está accesible públicamente, pero requiere contraseña para acceder
- Las operaciones de eliminación se realizan directamente desde el cliente
- En producción, considera mover operaciones sensibles a Cloud Functions
- La contraseña está hardcodeada en el código (cambiar en producción)

## 🔄 Próximas Mejoras

- [ ] Implementar Firebase Authentication para admin
- [ ] Agregar Cloud Functions para operaciones sensibles
- [ ] Implementar sistema de roles y permisos
- [ ] Agregar logs de auditoría
- [ ] Exportar datos a CSV/Excel
- [ ] Estadísticas y gráficos
- [ ] Búsqueda avanzada con múltiples filtros
- [ ] Paginación para grandes volúmenes de datos

---

**Última actualización**: Diciembre 2025

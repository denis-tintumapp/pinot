# 🔥 Configurar Firebase Hosting (Sin GitHub Actions)

## 🎯 Objetivo

Configurar Firebase Hosting para `tintum-hello-app` sin GitHub Actions (opcional).

---

## ✅ Paso 1: Verificar Autenticación

```bash
firebase login:list
```

Deberías ver tu cuenta autenticada.

---

## ✅ Paso 2: Verificar Proyecto

```bash
firebase projects:list
```

Deberías ver `tintum-hello-app` en la lista.

---

## ✅ Paso 3: Inicializar Firebase Hosting

```bash
cd /Users/denispaiva/proyectos/pinot
firebase init hosting
```

### Respuestas Recomendadas

1. **"What do you want to use as your public directory?"**
   - Respuesta: `dist` (si usas Vite) o `public` (si es estático)

2. **"Configure as a single-page app (rewrite all urls to /index.html)?"**
   - Respuesta: `Yes` o `Y`

3. **"Set up automatic builds and deploys with GitHub?"**
   - Respuesta: **`No`** o **`N`** ⚠️ (Esto evita el error)

4. **"File dist/index.html already exists. Overwrite?"**
   - Respuesta: `No` (si ya tienes contenido)

---

## 📝 Paso 4: Verificar Archivos Creados

### .firebaserc

```json
{
  "projects": {
    "default": "tintum-hello-app"
  }
}
```

### firebase.json

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

---

## 🚀 Paso 5: Desplegar (Cuando Esté Listo)

```bash
# Si usas Vite, primero hacer build
npm run build

# Desplegar a Firebase
firebase deploy --only hosting
```

---

## 🌐 Paso 6: Configurar Custom Domain (Después)

Una vez desplegado, puedes configurar `hello.tintum.app`:

1. **Firebase Console**: https://console.firebase.google.com/project/tintum-hello-app/hosting
2. **Add custom domain**: `hello.tintum.app`
3. **Configurar DNS** en Namecheap

---

## ✅ Verificar

```bash
# Ver estado
firebase hosting:sites:list

# Ver información del proyecto
firebase use tintum-hello-app
```

---

**¿Puedes ejecutar `firebase init hosting` de nuevo y responder `No` cuando pregunte sobre GitHub Actions?** 🚀

/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { resolve } from 'path';
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'fs';

// Determinar si estamos en modo producción
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
const isProduction = process.env.NODE_ENV === 'production';
export default defineConfig({
  // Configuración de Vitest
  test: {
    globals: true,
    // Habilita APIs globales como describe, it, expect
    environment: 'jsdom',
    // Entorno de testing para DOM
    setupFiles: ['./tests/setup.ts'],
    // Archivo de configuración inicial
    root: '.',
    // Buscar tests desde la raíz del proyecto
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'functions'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '**/*.d.ts', '**/*.config.*', '**/dist/**', '**/coverage/**', 'functions/**']
    },
    projects: [{
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      // Solo cargar Storybook durante tests, no durante build
      process.env.NODE_ENV !== 'production' ? storybookTest({
        configDir: path.join(dirname, '.storybook')
      }) : null].filter(Boolean),
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        },
        setupFiles: ['.storybook/vitest.setup.ts']
      }
    }, {
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      // Solo cargar Storybook durante tests, no durante build
      process.env.NODE_ENV !== 'production' ? storybookTest({
        configDir: path.join(dirname, '.storybook')
      }) : null].filter(Boolean),
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        },
        setupFiles: ['.storybook/vitest.setup.ts']
      }
    }]
  },
  root: './web',
  publicDir: false,
  // No copiar archivos públicos automáticamente (lo hacemos manualmente)
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Entry point principal de React (relativo a root: './web')
        main: './index.html',
        // Archivos de autenticación que necesitan ser bundlados con sus dependencias
        'auth/auth': './js/auth/auth.ts',
        'auth/auth-guard': './js/auth/auth-guard.ts',
        'auth/verify': './js/auth/verify.ts',
        'auth/signup': './js/auth/signup.ts',
        'auth/login': './js/auth/login.ts',
        // 'auth/user-ui': DEPRECATED - movido a .deprecated/
        'auth/pin': './js/auth/pin.ts',
        // Archivos de eventos que necesitan ser bundlados
        'event/events-setup': './js/event/events-setup.ts',
        'event/events-result': './js/event/events-result.ts',
        'event/events-history': './js/event/events-history.ts',
        // Archivos de admin - DEPRECATED (migrados a React), pero mantener para compatibilidad con HTML legacy
        // 'admin/admin-ui': DEPRECATED - movido a .deprecated/
        // 'admin/changelog-ui': DEPRECATED - movido a .deprecated/
        // 'admin/admin-ui-dashboard': DEPRECATED - movido a .deprecated/
        // Archivo principal de participación - DEPRECATED (migrado a React)
        // 'participar': DEPRECATED - movido a .deprecated/
        // Firestore.js necesita ser bundleado para resolver imports de Firebase
        'firestore': './js/firestore.js'
      },
      output: {
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/chunks/[name]-[hash].js',
        assetFileNames: assetInfo => {
          // Mantener sw.js y manifest.json sin hash
          if (assetInfo.name === 'sw.js' || assetInfo.name === 'manifest.json') {
            return '[name][extname]';
          }
          // HTML files: main -> index.html
          if (assetInfo.name?.endsWith('.html')) {
            // Vite genera main.html desde index-react.html, renombrarlo a index.html
            // assetInfo.name puede ser 'main.html' o el nombre completo del archivo
            if (assetInfo.name === 'main.html' || assetInfo.name?.includes('main.html')) {
              return 'index.html';
            }
            return '[name][extname]';
          }
          if (assetInfo.name?.endsWith('.css')) {
            return 'css/[name][extname]';
          }
          if (assetInfo.name?.match(/\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp|mp4)$/)) {
            const dir = assetInfo.name.includes('naipes') ? 'images/naipes' : 'images';
            return `${dir}/[name][extname]`;
          }
          return 'assets/[name]-[hash][extname]';
        },
        // Code splitting optimizado para mejor rendimiento
        manualChunks: id => {
          // Separar Firebase SDK en chunks específicos y optimizados
          if (id.includes('node_modules/firebase')) {
            // Firebase App (core) - pequeño, se carga primero
            if (id.includes('firebase/app') || id.includes('firebase/app/index')) {
              return 'firebase-app';
            }
            // Firebase Firestore - grande, separado
            if (id.includes('firebase/firestore')) {
              return 'firebase-firestore';
            }
            // Firebase Functions - separado
            if (id.includes('firebase/functions')) {
              return 'firebase-functions';
            }
            // Firebase Messaging - separado
            if (id.includes('firebase/messaging')) {
              return 'firebase-messaging';
            }
            // Firebase Auth - separado
            if (id.includes('firebase/auth')) {
              return 'firebase-auth';
            }
            // Otros módulos de Firebase - agrupar en chunk compartido
            return 'firebase-shared';
          }

          // React y React Router - chunk separado
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
            return 'react-vendor';
          }

          // DnD Kit - chunk separado (solo se usa en algunas páginas)
          if (id.includes('node_modules/@dnd-kit')) {
            return 'dnd-kit';
          }

          // Separar módulos grandes de la aplicación
          if (id.includes('web/js')) {
            // Módulos de core compartidos (pequeños, usados frecuentemente)
            if (id.includes('core/firebase-config') || id.includes('constantes')) {
              return 'core';
            }
            // Módulos de utilidades compartidas
            if (id.includes('firestore.js') || id.includes('error-handler')) {
              return 'utils';
            }
            // Admin panel modules (solo se cargan en admin)
            if (id.includes('adminpanel')) {
              return 'admin';
            }
          }

          // Separar páginas React en chunks individuales (ya se hace automáticamente con lazy loading)
          if (id.includes('web/src/pages')) {
            // Las páginas ya se separan automáticamente con React.lazy
            // Pero podemos agrupar páginas relacionadas
            if (id.includes('pages/auth')) {
              return 'pages-auth';
            }
            if (id.includes('pages/admin')) {
              return 'pages-admin';
            }
            // Páginas principales se mantienen en chunks separados
            return null; // Dejar que Vite maneje el splitting automático
          }

          // Separar hooks en chunk compartido
          if (id.includes('web/src/hooks')) {
            return 'hooks';
          }

          // Separar componentes en chunk compartido
          if (id.includes('web/src/components')) {
            return 'components';
          }

          // Chunk para otras vendor libraries
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: isProduction,
        // Eliminar console en producción
        drop_debugger: true,
        passes: 2 // Múltiples pases para mejor optimización
      },
      format: {
        comments: false // Eliminar comentarios
      }
    },
    // Source maps: 'hidden' en producción (para Sentry), 'true' en desarrollo
    sourcemap: isProduction ? 'hidden' : true,
    target: 'es2022',
    // Soporta top-level await
    chunkSizeWarningLimit: 1000,
    // Optimizaciones adicionales
    cssCodeSplit: true,
    // Code splitting para CSS también
    reportCompressedSize: true,
    // Reportar tamaños comprimidos
    assetsInlineLimit: 4096 // Inline assets menores a 4KB
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'web'),
      '@js': resolve(__dirname, 'web/js'),
      '@core': resolve(__dirname, 'web/js/core')
    },
    dedupe: ['react', 'react-dom']
  },
  server: {
    port: 3000,
    open: false
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'firebase/app', 'firebase/firestore', 'firebase/functions', 'firebase/messaging']
  },
  plugins: [react({
    // Habilitar Fast Refresh
    fastRefresh: true,
    // Incluir archivos .tsx y .ts
    include: '**/*.{jsx,tsx,ts}'
  }),
  // Plugin de Sentry para upload de source maps (solo en producción)
  process.env.NODE_ENV === 'production' && process.env.SENTRY_AUTH_TOKEN ? sentryVitePlugin({
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT || 'pinot-frontend',
    authToken: process.env.SENTRY_AUTH_TOKEN,
    release: {
      name: process.env.SENTRY_RELEASE || `pinot-frontend@${process.env.npm_package_version || 'unknown'}`
    },
    sourcemaps: {
      assets: './dist/**',
      ignore: ['node_modules']
    },
    telemetry: false // Deshabilitar telemetría
  }) : null, {
    name: 'copy-assets',
    closeBundle() {
      // Copiar imágenes y otros assets estáticos
      const assetsToCopy = [{
        from: 'web/images',
        to: 'dist/images'
      }, {
        from: 'web/api',
        to: 'dist/api'
      }];
      assetsToCopy.forEach(({
        from,
        to
      }) => {
        if (existsSync(from)) {
          // fs-extra copySync se manejará en el script de build
        }
      });
    }
  }, {
    name: 'replace-index-with-react',
    closeBundle() {
      // Después de que se cierre el bundle, reemplazar index.html con el contenido de index-react.html procesado
      const distDir = resolve(__dirname, '..', 'dist');
      const indexHtmlPath = resolve(distDir, 'index.html');
      const indexReactPath = resolve(__dirname, 'web', 'index-react.html');
      if (existsSync(indexHtmlPath) && existsSync(indexReactPath)) {
        // Buscar el archivo main.js generado en dist/js/
        const jsDir = resolve(distDir, 'js');
        let mainJsFile: string | null = null;
        if (existsSync(jsDir)) {
          const files = readdirSync(jsDir);
          mainJsFile = files.find(file => file.startsWith('main-') && file.endsWith('.js') && !file.endsWith('.map')) || null;
        }
        if (mainJsFile) {
          // Leer index-react.html
          let reactHtml = readFileSync(indexReactPath, 'utf-8');

          // Reemplazar la referencia a /src/main.tsx con la referencia al bundle de main
          reactHtml = reactHtml.replace(/<script type="module" src="\/src\/main\.tsx"><\/script>/, `<script type="module" crossorigin src="/js/${mainJsFile}"></script>`);

          // Buscar chunks en dist/js/chunks/
          const chunksDir = resolve(distDir, 'js', 'chunks');
          let chunksLinks = '';
          if (existsSync(chunksDir)) {
            const chunkFiles = readdirSync(chunksDir).filter(file => file.endsWith('.js') && !file.endsWith('.map')).map(file => `  <link rel="modulepreload" crossorigin href="/js/chunks/${file}">`).join('\n');
            if (chunkFiles) {
              chunksLinks = chunkFiles + '\n';
            }
          }

          // Agregar los modulepreload links antes de </head>
          if (chunksLinks) {
            reactHtml = reactHtml.replace('</head>', `${chunksLinks}</head>`);
          }

          // Agregar el link al CSS si existe
          const cssDir = resolve(distDir, 'css');
          if (existsSync(cssDir)) {
            const cssFiles = readdirSync(cssDir).filter(file => file.endsWith('.css'));
            if (cssFiles.length > 0) {
              cssFiles.forEach(cssFile => {
                reactHtml = reactHtml.replace('</head>', `  <link rel="stylesheet" crossorigin href="/css/${cssFile}">\n</head>`);
              });
            }
          }

          // Escribir el HTML de React como index.html
          writeFileSync(indexHtmlPath, reactHtml, 'utf-8');
          console.log('✅ index.html reemplazado con versión React');
        } else {
          console.warn('⚠️  No se encontró main.js generado, no se puede reemplazar index.html');
        }
      }
    }
  }]
});
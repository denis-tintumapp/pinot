/**
 * Componente principal de la aplicación
 * Maneja el routing y la estructura general
 * Optimizado con lazy loading para mejor performance
 */

import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { NotificationContainer, LoadingOverlay } from './components/ui';
import { initializeAuth } from './stores/authStore';

// Componente de carga
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-purple-950">
    <div className="spinner border-purple-600/30 border-t-purple-500 w-12 h-12"></div>
  </div>
);

// Componente para redirección de rutas .html
const HtmlRedirect: React.FC = () => {
  const { path } = useParams<{ path: string }>();
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:HtmlRedirect',message:'HtmlRedirect ejecutado',data:{path, redirectTo: `/${path}`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'debug_signup_html_redirect'})}).catch(()=>{});
  // #endregion
  return <Navigate to={`/${path}`} replace />;
};


// Páginas principales - cargar inmediatamente (críticas)
import HomePage from './pages/HomePage';
import HeroPage from './pages/HeroPage';
import ParticiparPage from './pages/ParticiparPage';
import ExplorePage from './pages/ExplorePage';
import FavsPage from './pages/FavsPage';
import ProfilePage from './pages/ProfilePage';

// Páginas de autenticación - lazy loading (cargar bajo demanda)
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const SignupPage = lazy(() => import('./pages/auth/SignupPage'));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const OnboardingPersistentePage = lazy(() => import('./pages/auth/OnboardingPersistentePage'));
const RegistroParticipantePage = lazy(() => import('./pages/auth/RegistroParticipantePage'));

// Páginas protegidas - lazy loading (solo para usuarios autenticados)
const ArmarEventoPage = lazy(() => import('./pages/auth/ArmarEventoPage'));
const ConfigurarEventoPage = lazy(() => import('./pages/auth/ConfigurarEventoPage'));

// Páginas de anfitrión - lazy loading
const AnfitrionPage = lazy(() => import('./pages/AnfitrionPage'));
const ResultadosPage = lazy(() => import('./pages/ResultadosPage'));

// Páginas de admin - lazy loading (solo para admins)
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));
const AdminChangelogPage = lazy(() => import('./pages/admin/AdminChangelogPage'));

const App: React.FC = () => {
  // Inicializar auth store al cargar la app
  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <>
      {/* Componentes globales de UI */}
      <NotificationContainer />
      <LoadingOverlay />
      
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Rutas públicas - cargar inmediatamente */}
          <Route path="/" element={<HeroPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/participar" element={<ParticiparPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/favs" element={<FavsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          
          {/* Rutas de autenticación - lazy loading */}
          <Route 
            path="/auth/login" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <LoginPage />
              </Suspense>
            } 
          />
          <Route 
            path="/auth/signup" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <SignupPage />
              </Suspense>
            } 
          />
          <Route 
            path="/auth/verify-email" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <VerifyEmailPage />
              </Suspense>
            } 
          />
          <Route 
            path="/auth/reset-password" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <ResetPasswordPage />
              </Suspense>
            } 
          />
          <Route 
            path="/auth/onboarding-persistente" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <OnboardingPersistentePage />
              </Suspense>
            } 
          />
          <Route 
            path="/auth/registro-participante" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <RegistroParticipantePage />
              </Suspense>
            } 
          />
          
          {/* Rutas protegidas (requieren autenticación) - lazy loading */}
          <Route
            path="/auth/armar-evento"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <ArmarEventoPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/auth/configurar-evento"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <ConfigurarEventoPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          
          {/* Rutas de anfitrión - lazy loading */}
          <Route 
            path="/anfitrion" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <AnfitrionPage />
              </Suspense>
            } 
          />
          <Route 
            path="/resultados" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <ResultadosPage />
              </Suspense>
            } 
          />
          
          {/* Rutas de admin - lazy loading */}
          <Route 
            path="/admin" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminPage />
              </Suspense>
            } 
          />
          <Route 
            path="/admin/changelog" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminChangelogPage />
              </Suspense>
            } 
          />
          
          {/* Redirección de rutas antiguas HTML */}
          <Route path="/hero.html" element={<Navigate to="/" replace />} />
          <Route path="/index.html" element={<Navigate to="/" replace />} />
          <Route path="/explore.html" element={<Navigate to="/explore" replace />} />
          <Route path="/favs.html" element={<Navigate to="/favs" replace />} />
          <Route path="/profile.html" element={<Navigate to="/profile" replace />} />
          <Route path="/auth/login.html" element={<Navigate to="/auth/login" replace />} />
          <Route path="/auth/login-host.html" element={<Navigate to="/auth/login" replace />} />
          <Route path="/auth/signup.html" element={<Navigate to="/auth/signup" replace />} />
          <Route path="/auth/signup-host-e.html" element={<Navigate to="/auth/signup" replace />} />
          <Route path="/auth/verify.html" element={<Navigate to="/auth/verify-email" replace />} />
          <Route path="/auth/verify-email.html" element={<Navigate to="/auth/verify-email" replace />} />
          <Route path="/auth/pin.html" element={<Navigate to="/" replace />} />
          <Route path="/auth/reset-password.html" element={<Navigate to="/auth/reset-password" replace />} />
          <Route path="/auth/armar-evento.html" element={<Navigate to="/auth/armar-evento" replace />} />
          <Route path="/auth/configurar-evento.html" element={<Navigate to="/auth/configurar-evento" replace />} />
          <Route path="/event/events-result.html" element={<Navigate to="/resultados" replace />} />
          <Route path="/event/events-history.html" element={<Navigate to="/resultados" replace />} />
          <Route path="/event/events-setup.html" element={<Navigate to="/auth/configurar-evento" replace />} />
          <Route path="/admin-logs" element={<Navigate to="/admin/changelog" replace />} />
          <Route path="/admin/admin-ui.html" element={<Navigate to="/admin" replace />} />
          <Route path="/adminpanel/admin-logs.html" element={<Navigate to="/admin/changelog" replace />} />
          
          {/* Redirección genérica para cualquier ruta .html */}
          <Route 
            path=":path.html" 
            element={<HtmlRedirect />} 
          />
          
          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default App;












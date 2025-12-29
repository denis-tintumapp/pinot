/**
 * Profile Page
 * Página de perfil de usuario
 * Migrado desde profile.html y profile.js
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { cerrarSesion } from '../../js/auth/auth';
import { useAnfitrionQuery } from '../hooks/queries/useAnfitrion';
import { useEventosQuery } from '../hooks/queries/useEventos';
import { useAuthStore } from '../stores';
import BottomNavigation from '../components/hero/BottomNavigation';
import { lazy, Suspense } from 'react';
const BottomSheet = lazy(() => import('../components/ui/BottomSheet'));

interface UserProfile {
  name: string;
  email: string | null;
  photoURL: string | null;
  alias?: string;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser, loading: authLoading } = useAuth();
  const { anfitrionId, anfitrionAlias } = useAuthStore();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Cargar datos del anfitrión desde Firestore si existe
  const { data: anfitrionData, isLoading: anfitrionLoading } = useAnfitrionQuery(
    anfitrionId || null
  );

  // Cargar eventos del usuario para contar
  const { data: eventosData, isLoading: eventosLoading } = useEventosQuery(
    authUser?.uid || anfitrionId || undefined
  );
  
  const eventosCount = eventosData?.length || 0;
  const favoritosCount = 23; // TODO: Conectar con datos reales de favoritos
  const scoringCount = 1532; // TODO: Conectar con datos reales de scoring

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProfilePage.tsx:useEffect',message:'useEffect ejecutado',data:{hasAuthUser:!!authUser,authUserId:authUser?.uid,anfitrionId,anfitrionAlias,hasAnfitrionData:!!anfitrionData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    loadUserProfile();
  }, [authUser, anfitrionData, anfitrionAlias]);

  const loadUserProfile = async () => {
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProfilePage.tsx:loadUserProfile',message:'loadUserProfile iniciado',data:{hasAuthUser:!!authUser},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      setLoading(true);
      
      // Datos estáticos/demo cuando no hay usuario autenticado
      if (!authUser) {
        setUser({
          name: 'Denis Paiva',
          email: 'denispaiva@gmail.com',
          photoURL: '/images/denis-tintum-profile.jpg',
          alias: undefined
        });
        setLoading(false);
        return;
      }

      // Obtener datos del usuario desde Firebase Auth si está autenticado
      const displayName = authUser.displayName || 
                         anfitrionAlias || 
                         anfitrionData?.alias || 
                         authUser.email?.split('@')[0] || 
                         'Usuario';
      
      const photoURL = authUser.photoURL || '/images/denis-tintum-profile.jpg';

      setUser({
        name: displayName,
        email: authUser.email,
        photoURL: photoURL,
        alias: anfitrionAlias || anfitrionData?.alias
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProfilePage.tsx:loadUserProfile',message:'Usuario cargado exitosamente',data:{displayName,email:authUser.email,hasPhotoURL:!!photoURL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProfilePage.tsx:loadUserProfile',message:'Error al cargar perfil',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      console.error('Error al cargar perfil:', error);
      // En caso de error, mostrar datos demo
      setUser({
        name: 'Denis Paiva',
        email: 'denispaiva@gmail.com',
        photoURL: '/images/denis-tintum-profile.jpg',
        alias: undefined
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      
      // Cerrar sesión con Firebase Auth
      const result = await cerrarSesion();
      
      if (result.success) {
        // Limpiar stores de Zustand
        useAuthStore.getState().clearAuth();
        
        // Redirigir a la página principal
        navigate('/', { replace: true });
      } else {
        console.error('Error al cerrar sesión:', result.error);
        alert('Error al cerrar sesión. Por favor, intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      alert('Error al cerrar sesión. Por favor, intenta nuevamente.');
    } finally {
      setLogoutLoading(false);
    }
  };

  if (authLoading || loading || anfitrionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-purple-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  // Siempre mostrar la página, incluso sin usuario autenticado (perfil estático/demo)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 relative z-[10] border-b border-gray-200/50 backdrop-blur-sm bg-white/90">
        {/* Logo */}
        <img src="/images/logo-pinot.png" alt="Pinot" className="h-12 w-auto" />
        {/* Menú hamburguesa - BottomSheet maneja el click internamente */}
        <button 
          id="menuToggle"
          className="p-3 text-gray-700 hover:text-gray-900 transition-colors"
          aria-label="Menú"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 relative z-[10] px-4 py-6 pb-24 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Profile Header - Centrado */}
          <section className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="relative">
                <div className="h-24 w-24 overflow-hidden rounded-full bg-gradient-to-br from-purple-400 to-pink-400">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-white text-3xl font-bold">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-purple-600 text-white shadow-lg transition-transform active:scale-95">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                </button>
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-purple-600">{user?.name || 'Usuario'}</h1>
            <p className="text-sm text-gray-600">{user?.email || ''}</p>
          </section>
          
          {/* Stats Grid - Con círculos con gradientes */}
          <section>
            <div className="grid grid-cols-3 gap-3">
              {/* Eventos */}
              <div className="flex flex-col items-center rounded-2xl border bg-white p-4">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 22h8M12 11v11m7-8l-7-8-7 8z"></path>
                  </svg>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {eventosLoading ? '...' : eventosCount}
                </div>
                <div className="text-xs text-gray-600">Eventos</div>
              </div>
              
              {/* Favoritos */}
              <div className="flex flex-col items-center rounded-2xl border bg-white p-4">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-red-500">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                  </svg>
                </div>
                <div className="text-2xl font-bold text-gray-900">{favoritosCount}</div>
                <div className="text-xs text-gray-600">Favoritos</div>
              </div>
              
              {/* Scoring */}
              <div className="flex flex-col items-center rounded-2xl border bg-white p-4">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500 to-orange-500">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <div className="text-2xl font-bold text-gray-900">{scoringCount}</div>
                <div className="text-xs text-gray-600">Scoring</div>
              </div>
            </div>
          </section>
          
          {/* Premium Banner */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 p-6 text-white shadow-xl">
            <div className="relative z-10">
              <div className="mb-2 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                ✨ Premium
              </div>
              <h2 className="mb-2 text-xl font-semibold">Actualiza a Premium</h2>
              <p className="mb-4 text-sm text-purple-100">
                Accede a funciones exclusivas y descuentos especiales
              </p>
              <button className="rounded-full bg-white px-6 py-2.5 font-medium text-purple-600 shadow-lg transition-transform active:scale-95">
                Saber más
              </button>
            </div>
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
          </section>
          
          {/* Menu Items */}
          <section>
            <div className="space-y-2">
              {/* Configuración */}
              <button className="flex w-full items-center gap-4 rounded-2xl border bg-white p-4 transition-all active:scale-[0.98] text-left">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                  <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                </div>
                <span className="flex-1 font-medium text-gray-900">Configuración</span>
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
              
              {/* Notificaciones */}
              <button className="flex w-full items-center gap-4 rounded-2xl border bg-white p-4 transition-all active:scale-[0.98] text-left">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                  <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                  </svg>
                </div>
                <span className="flex-1 font-medium text-gray-900">Notificaciones</span>
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-2 text-xs text-white">3</span>
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
              
              {/* Ayuda y soporte */}
              <button className="flex w-full items-center gap-4 rounded-2xl border bg-white p-4 transition-all active:scale-[0.98] text-left">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                  <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <span className="flex-1 font-medium text-gray-900">Ayuda y soporte</span>
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
              
              {/* Cerrar sesión - Solo mostrar si hay usuario autenticado */}
              {authUser && (
                <button 
                  onClick={handleLogout}
                  disabled={logoutLoading}
                  className="flex w-full items-center gap-4 rounded-2xl border bg-white p-4 transition-all active:scale-[0.98] text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                    <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                    </svg>
                  </div>
                  <span className="flex-1 font-medium text-red-600">
                    {logoutLoading ? 'Cerrando sesión...' : 'Cerrar sesión'}
                  </span>
                  {!logoutLoading && (
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"></path>
                    </svg>
                  )}
                </button>
              )}
            </div>
          </section>
          
          {/* Versión */}
          <div className="pb-2 text-center text-xs text-gray-500">
            Versión 1.0.0
          </div>
        </div>
      </main>

      {/* Navegación inferior */}
      <BottomNavigation />

      {/* Bottom Sheet */}
      <Suspense fallback={null}>
        <BottomSheet />
      </Suspense>
    </div>
  );
};

export default ProfilePage;

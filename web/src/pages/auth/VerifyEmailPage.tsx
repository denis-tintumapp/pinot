/**
 * Página de Verificación de Email
 * Migración desde verify-email.html
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getUsuarioActualAuth, reenviarVerificacionEmail, onAuthStateChange } from '../../../js/auth/auth';
import { useRecaptcha } from '../../hooks/useRecaptcha';
import { getAuth, applyActionCode, reload } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '../../../js/core/firebase-config';

const VerifyEmailPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [loading, setLoading] = useState(false);
  const [emailVerificado, setEmailVerificado] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Hook de reCAPTCHA (se ejecuta automáticamente al cargar con acción 'page_load')
  const { executeRecaptcha } = useRecaptcha(true);

  useEffect(() => {
    const procesarVerificacion = async () => {
      // Verificar si hay parámetros de acción de Firebase (cuando el usuario hace clic en el enlace del email)
      const oobCode = searchParams.get('oobCode');
      const mode = searchParams.get('mode');
      const emailParam = searchParams.get('email');

      // Si hay código de acción y modo es verifyEmail, procesar la verificación
      if (oobCode && mode === 'verifyEmail') {
        setLoading(true);
        setMessage('Verificando email...');
        setMessageType('info');

        try {
          // Inicializar Firebase si no está inicializado
          let app;
          if (getApps().length === 0) {
            app = initializeApp(firebaseConfig);
          } else {
            app = getApps()[0];
          }

          if (!app) {
            throw new Error('No se pudo inicializar Firebase');
          }

          const auth = getAuth(app);
          
          // Aplicar el código de acción para verificar el email
          await applyActionCode(auth, oobCode);
          
          // Recargar el usuario para obtener el estado actualizado de emailVerified
          const currentUser = auth.currentUser;
          if (currentUser) {
            await reload(currentUser);
          }
          
          // Verificación exitosa - mostrar confirmación clara
          setEmailVerificado(true);
          setMessage('✅ ¡Email verificado exitosamente! Tu cuenta ha sido verificada correctamente.');
          setMessageType('success');
          setLoading(false);
          
          // Limpiar parámetros de la URL
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete('oobCode');
          newSearchParams.delete('mode');
          newSearchParams.delete('apiKey');
          newSearchParams.delete('continueUrl');
          window.history.replaceState({}, '', `${window.location.pathname}${newSearchParams.toString() ? '?' + newSearchParams.toString() : ''}`);
          
          // No redirigir automáticamente, permitir que el usuario vea la confirmación
          // El usuario puede hacer clic en "Continuar" cuando esté listo
        } catch (error: any) {
          console.error('Error al verificar email:', error);
          let errorMessage = 'Error al verificar el email. ';
          
          if (error.code === 'auth/invalid-action-code') {
            errorMessage += 'El enlace de verificación ha expirado o ya fue usado.';
          } else if (error.code === 'auth/expired-action-code') {
            errorMessage += 'El enlace de verificación ha expirado. Por favor, solicita uno nuevo.';
          } else {
            errorMessage += error.message || 'Por favor, intenta nuevamente.';
          }
          
          setMessage(errorMessage);
          setMessageType('error');
          setLoading(false);
        }
        return;
      }

      // Si no hay código de acción, continuar con el flujo normal
      const user = getUsuarioActualAuth();

      if (emailParam) {
        setEmail(emailParam);
      } else if (user?.email) {
        setEmail(user.email);
      } else {
        // No hay usuario ni email, redirigir a login
        navigate('/auth/login');
        return;
      }

      // Verificar si el email ya está verificado
      if (user?.emailVerified) {
        setMessage('✅ Tu email ya está verificado. Redirigiendo...');
        setMessageType('success');
        setTimeout(() => {
          navigate('/auth/configurar-evento');
        }, 2000);
        return;
      }

      // Escuchar cambios en el estado de verificación
      const unsubscribe = onAuthStateChange((updatedUser) => {
        if (updatedUser?.emailVerified) {
          setMessage('✅ Email verificado correctamente. Redirigiendo...');
          setMessageType('success');
          setTimeout(() => {
            navigate('/auth/configurar-evento');
          }, 2000);
        }
      });

      return () => {
        unsubscribe();
      };
    };

    procesarVerificacion();
  }, [navigate, searchParams]);

  const handleReenviar = async () => {
    setLoading(true);
    setMessage('');

    try {
      // Obtener token de reCAPTCHA v3 usando el hook
      const recaptchaToken = await executeRecaptcha('resend_verification');
      // El hook maneja los errores internamente y retorna undefined si falla
      // Continuar sin token si falla reCAPTCHA (no bloquear reenvío)
      // El backend puede validar el token si está presente, pero no bloqueará si falta

      const result = await reenviarVerificacionEmail(recaptchaToken);

      if (result.success) {
        setMessage('✅ Email de verificación reenviado. Revisa tu bandeja de entrada.');
        setMessageType('success');
      } else {
        setMessage(result.error || 'Error al reenviar email');
        setMessageType('error');
      }
    } catch (err: any) {
      console.error('Error al reenviar email:', err);
      setMessage('Error inesperado al reenviar email');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-0.5">
            <img
              src="/images/logo-pinot.png"
              alt="Pinot Logo"
              className="w-full max-w-[560px]"
              style={{ height: 'clamp(8.5rem, 11vw, 13.6rem)' }}
            />
          </div>
          <p className="text-white/90 text-lg font-medium font-branding">Verificar Email</p>
        </div>

        {/* Contenido */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="text-white/80 mb-6 text-center">
            <p className="mb-4 text-lg">Verifica tu correo electrónico</p>
            <p className="text-sm mb-4">Hemos enviado un email de verificación a:</p>
            <p className="font-semibold mb-6">{email || 'cargando...'}</p>

            {message && (
              <div
                className={`rounded-lg p-4 text-sm mb-4 ${
                  messageType === 'success'
                    ? 'bg-green-500/20 border border-green-500/50 text-green-200'
                    : messageType === 'error'
                    ? 'bg-red-500/20 border border-red-500/50 text-red-200'
                    : 'bg-blue-500/20 border border-blue-500/50 text-blue-200'
                }`}
              >
                {message}
              </div>
            )}

            <p className="text-sm mb-4">
              Por favor, revisa tu bandeja de entrada y haz click en el enlace de verificación.
            </p>
            <p className="text-xs text-white/60 mb-6">
              Si no recibes el email, verifica tu carpeta de spam.
            </p>
          </div>

          <div className="space-y-4">
            {emailVerificado ? (
              <>
                <button
                  onClick={() => navigate('/auth/configurar-evento')}
                  className="w-full bg-gradient-to-r from-green-500 to-green-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:from-green-600 hover:to-green-800 transition-all"
                >
                  Continuar
                </button>
                <div className="text-center">
                  <a href="/" className="text-white/80 hover:text-white text-sm underline">
                    Volver al inicio
                  </a>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={handleReenviar}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:from-purple-600 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Enviando...' : 'Reenviar Email de Verificación'}
                </button>

                <div className="text-center">
                  <a href="/auth/login" className="text-white/80 hover:text-white text-sm underline">
                    Ya verifiqué mi email
                  </a>
                </div>

                <div className="text-center mt-4">
                  <a href="/" className="text-white/80 hover:text-white text-sm underline">
                    Volver al inicio
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;












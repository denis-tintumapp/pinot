/**
 * Página de Login
 * Migración desde login-host.html
 * Refactorizado para usar React Hook Form con Zod
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { iniciarSesion } from '../../../js/auth/auth';
import { useRecaptcha } from '../../hooks/useRecaptcha';
import { LoginUsuarioSchema, type LoginUsuario } from '../../schemas/usuario.schema';
import { FormInput, FormError, FormButton } from '../../components/forms';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hook de reCAPTCHA (se ejecuta automáticamente al cargar con acción 'page_load')
  const { executeRecaptcha } = useRecaptcha(true);

  // Obtener ruta de redirección (desde state o query params)
  const from = (location.state as any)?.from?.pathname || 
               new URLSearchParams(location.search).get('redirect') || 
               '/auth/configurar-evento';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm<LoginUsuario>({
    resolver: zodResolver(LoginUsuarioSchema),
    mode: 'onBlur', // Validar al perder el foco
  });

  const onSubmit = async (data: LoginUsuario) => {
    try {
      // Obtener token de reCAPTCHA v3 usando el hook
      const recaptchaToken = await executeRecaptcha('login');
      // El hook maneja los errores internamente y retorna undefined si falla
      // Continuar sin token si falla reCAPTCHA (no bloquear login)
      // El backend puede validar el token si está presente, pero no bloqueará si falta

      const result = await iniciarSesion(data.email, data.password, recaptchaToken);

      if (result.success && result.user) {
        // Asegurar que siempre redirija a configurar-evento si no hay redirect específico
        const redirectTo = from === '/auth/armar-evento' ? '/auth/configurar-evento' : from;
        navigate(redirectTo, { replace: true });
      } else {
        setFormError('root', {
          type: 'manual',
          message: result.error || 'Error al iniciar sesión',
        });
      }
    } catch (err: any) {
      console.error('Error al iniciar sesión:', err);
      setFormError('root', {
        type: 'manual',
        message: 'Error inesperado al iniciar sesión',
      });
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
            />
          </div>
          <p className="text-white/90 text-lg font-medium font-branding">Iniciar Sesión</p>
        </div>

        {/* Formulario */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <FormInput
              label="Correo Electrónico"
              name="email"
              type="email"
              register={register}
              error={errors.email}
              required
              placeholder="tu@email.com"
              autoComplete="email"
            />

            {/* Contraseña */}
            <FormInput
              label="Contraseña"
              name="password"
              type="password"
              register={register}
              error={errors.password}
              required
              placeholder="Tu contraseña"
              autoComplete="current-password"
            />

            {/* Link a reset password */}
            <div className="text-right">
              <a href="/auth/reset-password" className="text-white/80 hover:text-white text-xs underline">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Mensaje de error */}
            {errors.root && (
              <FormError message={errors.root.message || 'Error al iniciar sesión'} />
            )}

            {/* Botón Submit */}
            <FormButton
              type="submit"
              loading={isSubmitting}
              loadingText="Iniciando sesión..."
            >
              Iniciar Sesión
            </FormButton>

            {/* Link a signup */}
            <div className="text-center mt-4">
              <a href="/auth/signup" className="text-white/80 hover:text-white text-sm underline">
                Crear nueva cuenta
              </a>
            </div>

            {/* Link a inicio */}
            <div className="text-center mt-4">
              <a href="/" className="text-white/80 hover:text-white text-sm underline">
                Volver al inicio
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;












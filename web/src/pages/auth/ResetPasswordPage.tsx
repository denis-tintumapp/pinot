/**
 * Página de Recuperación de Contraseña
 * Migración desde reset-password.html
 * Refactorizado para usar React Hook Form con Zod
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { enviarResetPassword } from '../../../js/auth/auth';
import { useRecaptcha } from '../../hooks/useRecaptcha';
import { ResetPasswordSchema, type ResetPassword } from '../../schemas/usuario.schema';
import { FormInput, FormError, FormButton } from '../../components/forms';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [success, setSuccess] = React.useState(false);

  // Hook de reCAPTCHA (se ejecuta automáticamente al cargar con acción 'page_load')
  const { executeRecaptcha } = useRecaptcha(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm<ResetPassword>({
    resolver: zodResolver(ResetPasswordSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: ResetPassword) => {
    setSuccess(false);

    try {
      // Obtener token de reCAPTCHA v3 usando el hook
      const recaptchaToken = await executeRecaptcha('reset_password');

      const result = await enviarResetPassword(data.email, recaptchaToken);

      if (result.success) {
        setSuccess(true);
      } else {
        setFormError('root', {
          message: result.error || 'Error al enviar el correo. Por favor, intenta nuevamente.',
        });
      }
    } catch (err: any) {
      console.error('Error al enviar email de recuperación:', err);
      setFormError('root', {
        message: 'Error inesperado al enviar el correo. Por favor, intenta nuevamente.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img
              src="/images/logo-pinot.png"
              alt="Pinot Logo"
              className="h-12 w-auto"
            />
            <h1 className="text-4xl font-bold text-white font-branding">Pinot</h1>
          </div>
          <p className="text-white/80 text-lg">Recuperar Contraseña</p>
        </div>

        {/* Contenido */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          {!success ? (
            <>
              <p className="text-white/80 text-sm mb-6">
                Ingresa tu correo electrónico y te enviaremos un enlace para recuperar tu contraseña.
              </p>

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
                  disabled={isSubmitting}
                  autoComplete="email"
                />

                {/* Mensaje de error */}
                {errors.root && (
                  <FormError message={errors.root.message} type="error" />
                )}

                {/* Botón Submit */}
                <FormButton
                  type="submit"
                  loading={isSubmitting}
                  loadingText="Enviando..."
                >
                  Enviar enlace de recuperación
                </FormButton>

                {/* Links */}
                <div className="text-center mt-4 space-y-2">
                  <div>
                    <a href="/auth/login" className="text-white/80 hover:text-white text-sm underline">
                      Volver al login
                    </a>
                  </div>
                  <div>
                    <a href="/" className="text-white/80 hover:text-white text-sm underline">
                      Volver al inicio
                    </a>
                  </div>
                </div>
              </form>
            </>
          ) : (
            /* Mensaje de éxito */
            <div className="text-center">
              <div className="text-green-400 text-5xl mb-4">✓</div>
              <h3 className="text-white font-semibold text-lg mb-2">¡Enlace enviado!</h3>
              <p className="text-white/80 text-sm mb-6">
                Te hemos enviado un correo con las instrucciones para recuperar tu contraseña.
                Revisa tu bandeja de entrada (y spam).
              </p>
              <div className="space-y-3">
                <a
                  href="/auth/login"
                  className="block w-full bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:from-purple-600 hover:to-purple-800 transition-all text-center"
                >
                  Volver al login
                </a>
                <a href="/" className="text-white/80 hover:text-white text-sm underline block">
                  Volver al inicio
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;







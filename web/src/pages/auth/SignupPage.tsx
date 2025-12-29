/**
 * Página de Registro
 * Migración desde signup-host-e.html
 * Registro de anfitrión sin contraseña (se genera automáticamente)
 * Refactorizado para usar React Hook Form con Zod
 */

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { registrarAnfitrionEfimero } from '../../../js/auth/auth';
import { useRecaptcha } from '../../hooks/useRecaptcha';
import { RegisterUsuarioSchema, type RegisterUsuario } from '../../schemas/usuario.schema';
import { FormInput, FormError, FormButton } from '../../components/forms';

const SignupPage: React.FC = () => {
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [emailForRedirect, setEmailForRedirect] = useState<string>('');
  const navigate = useNavigate();
  const hasNavigatedRef = useRef(false); // Guard para prevenir múltiples navegaciones

  // Log cuando el componente se monta
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SignupPage.tsx:useEffect:mount',message:'SignupPage montado',data:{windowLocation: window.location.href, pathname: window.location.pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'debug_signup_html_redirect'})}).catch(()=>{});
    // #endregion
  }, []);

  // Hook de reCAPTCHA (se ejecuta automáticamente al cargar con acción 'page_load')
  const { ready: recaptchaReady, executeRecaptcha } = useRecaptcha(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
    watch,
    setValue,
  } = useForm<RegisterUsuario>({
    resolver: zodResolver(RegisterUsuarioSchema),
    mode: 'onBlur', // Validar al perder el foco
  });

  const alias = watch('alias') || '';
  const email = watch('email') || '';

  // Contador regresivo para redirección
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && emailForRedirect && !hasNavigatedRef.current) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SignupPage.tsx:useEffect:countdown',message:'Countdown llegó a 0, navegando',data:{emailForRedirect, hasNavigated: hasNavigatedRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'debug_signup_redirect_1'})}).catch(()=>{});
      // #endregion
      // Resetear countdown, limpiar emailForRedirect y marcar que ya navegamos para evitar loops
      const emailToNavigate = emailForRedirect; // Guardar email antes de limpiar
      setCountdown(null);
      setEmailForRedirect(''); // Limpiar email para que el useEffect no se ejecute de nuevo
      hasNavigatedRef.current = true;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SignupPage.tsx:useEffect:countdown',message:'Llamando navigate',data:{route: `/auth/verify-email?email=${encodeURIComponent(emailToNavigate)}`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'debug_signup_redirect_2'})}).catch(()=>{});
      // #endregion
      navigate(`/auth/verify-email?email=${encodeURIComponent(emailToNavigate)}`);
    }
    return undefined;
  }, [countdown, navigate, emailForRedirect]);

  // Log de errores de validación
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SignupPage.tsx:useEffect:errors',message:'Errores de validación detectados',data:{errors: Object.keys(errors), errorDetails: errors},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'debug_signup_4'})}).catch(()=>{});
      // #endregion
    }
  }, [errors]);

  // Handler para alias con sanitización
  const handleAliasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trimStart();
    if (value.length <= 20) {
      setValue('alias', value, { shouldValidate: true });
    }
  };

  // Handler para email con sanitización
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trimStart().toLowerCase();
    setValue('email', value, { shouldValidate: true });
  };

  const onSubmit = async (data: RegisterUsuario) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SignupPage.tsx:onSubmit',message:'Inicio de onSubmit',data:{email: data.email, alias: data.alias, hasNombreCompleto: !!data.nombreCompleto},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'debug_signup_1'})}).catch(()=>{});
    // #endregion
    
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SignupPage.tsx:onSubmit',message:'Antes de setSuccess',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'debug_signup_3'})}).catch(()=>{});
      // #endregion
      setSuccess('');
    } catch (setStateError) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SignupPage.tsx:onSubmit',message:'Error en setSuccess',data:{error: String(setStateError)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'debug_signup_3'})}).catch(()=>{});
      // #endregion
    }

    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SignupPage.tsx:onSubmit',message:'Ejecutando reCAPTCHA',data:{recaptchaReady: recaptchaReady},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'debug_signup_1'})}).catch(()=>{});
      // #endregion
      
      // Obtener token de reCAPTCHA v3 usando el hook
      const recaptchaToken = await executeRecaptcha('signup');
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SignupPage.tsx:onSubmit',message:'reCAPTCHA completado',data:{hasToken: !!recaptchaToken},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'debug_signup_1'})}).catch(()=>{});
      // #endregion
      
      // El hook maneja los errores internamente y retorna undefined si falla
      // Continuar sin token si falla reCAPTCHA (no bloquear registro)
      // El backend validará el token si está presente, pero no bloqueará si falta

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SignupPage.tsx:onSubmit',message:'Llamando registrarAnfitrionEfimero',data:{email: data.email, nombre: data.nombreCompleto?.trim() || data.alias, hasRecaptchaToken: !!recaptchaToken},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'debug_signup_1'})}).catch(()=>{});
      // #endregion

      const result = await registrarAnfitrionEfimero(
        data.email,
        data.nombreCompleto?.trim() || data.alias,
        recaptchaToken
      );

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SignupPage.tsx:onSubmit',message:'Resultado de registrarAnfitrionEfimero',data:{success: result.success, hasError: !!result.error, redirectToOnboarding: result.redirectToOnboarding},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'debug_signup_1'})}).catch(()=>{});
      // #endregion

      if (result.success) {
        if (result.redirectToOnboarding) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SignupPage.tsx:onSubmit',message:'Redirigiendo a onboarding persistente',data:{email: data.email, hasNavigated: hasNavigatedRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'debug_signup_redirect_3'})}).catch(()=>{});
          // #endregion
          // El email ya tiene eventos, redirigir a onboarding persistente
          if (!hasNavigatedRef.current) {
            hasNavigatedRef.current = true;
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SignupPage.tsx:onSubmit',message:'Llamando navigate a onboarding',data:{route: `/auth/onboarding-persistente?email=${encodeURIComponent(data.email)}`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'debug_signup_redirect_4'})}).catch(()=>{});
            // #endregion
            navigate(`/auth/onboarding-persistente?email=${encodeURIComponent(data.email)}`);
          }
        } else {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SignupPage.tsx:onSubmit',message:'Registro exitoso, mostrando mensaje',data:{email: data.email, hasNavigated: hasNavigatedRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'debug_signup_1'})}).catch(()=>{});
          // #endregion
          setSuccess(`¡Registro exitoso! Te hemos enviado un email a ${data.email} con tu contraseña temporal. Revisa tu bandeja de entrada (y spam) en los próximos minutos.`);
          // Solo iniciar countdown si no hemos navegado ya
          if (!hasNavigatedRef.current) {
            setEmailForRedirect(data.email); // Guardar email para la redirección
            setCountdown(5); // Iniciar contador de 5 segundos
          }
        }
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SignupPage.tsx:onSubmit',message:'Registro falló',data:{error: result.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'debug_signup_1'})}).catch(()=>{});
        // #endregion
        setFormError('root', {
          type: 'manual',
          message: result.error || 'Error al registrar usuario',
        });
      }
    } catch (err: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SignupPage.tsx:onSubmit',message:'Excepción capturada',data:{error: err?.message, code: err?.code, stack: err?.stack, errorObject: String(err)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'debug_signup_1'})}).catch(()=>{});
      // #endregion
      
      console.error('Error al registrar:', err);
      console.error('Detalles del error:', {
        code: err?.code,
        message: err?.message,
        error: err
      });
      
      // Mostrar error más específico si está disponible
      const errorMessage = err?.message || err?.error || 'Error inesperado al registrar usuario. Por favor, verifica que el email sea válido e intenta nuevamente.';
      setFormError('root', {
        type: 'manual',
        message: errorMessage,
      });
    }
  };

  return (
    <div className="min-h-screen bg-purple-600 flex items-center justify-center p-4">
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
          <p className="text-white/90 text-lg font-medium font-branding">Registro de anfitrión</p>
        </div>

        {/* Formulario */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <form onSubmit={handleSubmit(
            (data) => {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SignupPage.tsx:form:onSubmit:success',message:'Form submit validation passed',data:{email: data.email, alias: data.alias},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'debug_signup_6'})}).catch(()=>{});
              // #endregion
              onSubmit(data);
            },
            (errors) => {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SignupPage.tsx:form:onSubmit:validationError',message:'Form submit validation failed',data:{errors: Object.keys(errors), errorDetails: errors},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'debug_signup_7'})}).catch(()=>{});
              // #endregion
            }
          )} className="space-y-6">
            {/* Alias */}
            <FormInput
              label="Alias"
              name="alias"
              type="text"
              register={register}
              error={errors.alias}
              required
              placeholder="Ej: Juan, María, ElSommelier"
              disabled={isSubmitting}
              maxLength={20}
              showCharCount
              value={alias}
              onChange={handleAliasChange}
              autoComplete="username"
            />

            {/* Nombre Completo */}
            <FormInput
              label="Nombre Completo"
              name="nombreCompleto"
              type="text"
              register={register}
              error={errors.nombreCompleto}
              placeholder="Opcional: Juan Pérez"
              disabled={isSubmitting}
              maxLength={100}
              autoComplete="name"
            />

            {/* Email */}
            <div>
              <FormInput
                label="Correo Electrónico"
                name="email"
                type="email"
                register={register}
                error={errors.email}
                required
                placeholder="ejemplo@correo.com"
                disabled={isSubmitting}
                value={email}
                onChange={handleEmailChange}
                autoComplete="email"
              />
              <p className="text-white/70 text-xs mt-2">
                Recibirás una contraseña temporal de 6 caracteres alfanuméricos por correo
              </p>
            </div>

            {/* Mensajes */}
            {errors.root && (
              <FormError message={errors.root.message || 'Error al registrar usuario'} />
            )}
            {success && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-sm text-green-200 animate-fade-in">
                <div className="flex items-start gap-2">
                  <span className="text-green-400 text-lg">✓</span>
                  <div className="flex-1">
                    <p>{success}</p>
                    {countdown !== null && (
                      <p className="text-green-300 text-xs mt-2">
                        Redirigiendo en {countdown} segundo{countdown !== 1 ? 's' : ''}...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Botón Submit */}
            <FormButton
              type="submit"
              loading={isSubmitting}
              loadingText="Registrando..."
              onClick={() => {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SignupPage.tsx:FormButton:onClick',message:'Botón submit clickeado',data:{isSubmitting, errorsCount: Object.keys(errors).length, errors: Object.keys(errors)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'debug_signup_5'})}).catch(()=>{});
                // #endregion
              }}
            >
              Crear Cuenta de Anfitrión
            </FormButton>

            {/* Link a login */}
            <div className="text-center mt-4">
              <a href="/auth/login" className="text-white/80 hover:text-white text-sm underline">
                Ya soy anfitrión
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

export default SignupPage;












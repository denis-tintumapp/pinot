/**
 * Página principal - Ingreso con PIN
 * Migración gradual desde index.html
 * Refactorizado para usar React Hook Form con Zod
 */

import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRecaptcha } from '../hooks/useRecaptcha';
import { PinEventoSchema, type PinEvento } from '../schemas/usuario.schema';
import { PinInput } from '../components/forms/PinInput';
import { FormButton } from '../components/forms';
import PWAInstallButton from '../components/PWAInstallButton';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Hook de reCAPTCHA (se ejecuta automáticamente al cargar con acción 'page_load')
  const { executeRecaptcha } = useRecaptcha(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setError: setFormError,
  } = useForm<PinEvento>({
    resolver: zodResolver(PinEventoSchema),
    mode: 'onBlur',
  });

  const pin = watch('pin') || '';

  // Inicializar video de fondo
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      
      video.play().catch((err) => {
        console.log('Autoplay bloqueado, el video se reproducirá cuando el usuario interactúe:', err);
        const playVideo = () => {
          video.play().catch(() => {});
        };
        document.addEventListener('click', playVideo, { once: true });
        document.addEventListener('touchstart', playVideo, { once: true, passive: true });
      });
      
      video.addEventListener('error', () => {
        console.error('Error al cargar el video');
      });
      
      video.addEventListener('ended', () => {
        video.currentTime = 0;
        video.play();
      });
    }
  }, []);

  const onSubmit = async (data: PinEvento) => {
    try {
      // Obtener token de reCAPTCHA antes de buscar el evento
      let recaptchaToken: string | undefined;
      try {
        recaptchaToken = await executeRecaptcha('pin_entry');
      } catch (recaptchaError: any) {
        // Continuar sin token si hay error (degradación elegante)
      }
      
      // Importar función de búsqueda de evento
      const { buscarEventoPorPIN } = await import('../../js/firestore.js');
      const resultado = await buscarEventoPorPIN(data.pin);

      if (resultado && resultado.ok && resultado.data) {
        const evento = resultado.data as any;
        navigate(`/participar?pin=${data.pin}&evento=${evento.id || data.pin}`);
      } else {
        setFormError('pin', {
          message: 'PIN no encontrado. Por favor, verifica el código.',
        });
      }
    } catch (err: any) {
      console.error('Error al buscar evento:', err);
      setFormError('root', {
        message: 'Error al buscar el evento. Por favor, intenta nuevamente.',
      });
    }
  };

  return (
    <div className="min-h-screen splash-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Video de fondo en loop */}
      <video 
        ref={videoRef}
        id="backgroundVideo"
        className="absolute inset-0 w-full h-full object-cover z-0"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src="/images/intro-splash.mp4" type="video/mp4" />
      </video>
      
      {/* Overlay oscuro para mejorar legibilidad */}
      <div className="absolute inset-0 bg-black/40 z-10"></div>
      
      {/* Contenido Principal (sobre el video) */}
      <div className="max-w-sm w-full space-y-6 flex-1 flex flex-col justify-center relative z-20">
        {/* Logo Pinot */}
        <div className="flex justify-center mb-6">
          <img
            src="/images/logo-pinot.png"
            alt="Pinot"
            className="h-auto w-full max-w-[560px] drop-shadow-2xl"
          />
        </div>
        
        {/* Frase sobre el PIN */}
        <p className="text-white text-center text-lg font-light italic mb-2 drop-shadow-lg">
          El vino como juego. El disfrute como premio.
        </p>
        
        {/* Formulario con PIN */}
        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
          {/* Campo PIN */}
          <PinInput
            name="pin"
            register={register}
            error={errors.pin}
            disabled={isSubmitting}
          />
          
          {/* Mensaje de error general */}
          {errors.root && (
            <p className="text-white text-sm text-center drop-shadow-lg">{errors.root.message}</p>
          )}
          
          {/* Botón Ingresar */}
          <FormButton
            type="submit"
            disabled={isSubmitting || pin.length !== 5}
            loading={isSubmitting}
            loadingText="Buscando..."
            className="w-full py-4 bg-white hover:bg-gray-100 text-black font-bold text-xl rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Ingresar
          </FormButton>
        </form>
        
        {/* Ícono de Puerta Animado (Registrar) - Debajo del botón, alineado a la derecha */}
        <div className="w-full flex justify-end items-center mt-4 group/anfitrion">
          {/* Leyenda animada tipo bandera - al lado de la puerta */}
          <div className="host-flag-banner relative z-20 pointer-events-none flex items-center gap-1.5">
            <div className="host-flag-text text-white/40 text-xs sm:text-sm font-medium whitespace-nowrap">
              Registrar
            </div>
            {/* Flecha señalando a la puerta - más cerca y alineada a la derecha */}
            <div className="relative flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/40">
                <path d="M4 8L12 8M12 8L9 5M12 8L9 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          
          <a 
            href="/auth/signup" 
            onClick={(e) => {
              // Forzar navegación completa del navegador (no usar React Router)
              e.preventDefault();
              window.location.href = '/auth/signup';
            }}
            className="relative z-30 cursor-pointer transition-transform active:scale-95 hover:scale-110 touch-manipulation group ml-1.5"
            title="Registrar"
            aria-label="Registrar usuario"
          >
            <div className="relative w-12 h-14 sm:w-14 sm:h-16 md:w-[50px] md:h-[62px]">
              <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-lg">
                {/* Marco de la puerta */}
                <rect 
                  x="10" 
                  y="10" 
                  width="80" 
                  height="100" 
                  rx="4" 
                  fill="rgba(255, 255, 255, 0.25)"
                  stroke="rgba(255, 255, 255, 0.6)"
                  strokeWidth="2"
                  style={{ backdropFilter: 'blur(10px)' }}
                />
                {/* Panel de la puerta */}
                <rect 
                  x="15" 
                  y="15" 
                  width="70" 
                  height="90" 
                  rx="2" 
                  fill="rgba(139, 92, 246, 0.9)"
                  stroke="rgba(255, 255, 255, 0.7)"
                  strokeWidth="2"
                  className="door-panel"
                />
                {/* Manija */}
                <circle 
                  cx="75" 
                  cy="60" 
                  r="4" 
                  fill="rgba(255, 255, 255, 0.95)"
                  className="door-handle"
                />
                {/* Línea decorativa vertical */}
                <line 
                  x1="50" 
                  y1="20" 
                  x2="50" 
                  y2="100" 
                  stroke="rgba(255, 255, 255, 0.4)" 
                  strokeWidth="1"
                />
              </svg>
            </div>
          </a>
        </div>
      </div>
      
      {/* Botón de instalación PWA */}
      <PWAInstallButton />
    </div>
  );
};

export default HomePage;












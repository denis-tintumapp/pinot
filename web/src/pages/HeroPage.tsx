/**
 * Hero Page - Página principal de bienvenida
 * Migración completa desde hero.html a React
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SlideButton from '../components/hero/SlideButton';
import BottomNavigation from '../components/hero/BottomNavigation';
import { lazy, Suspense } from 'react';
const BottomSheet = lazy(() => import('../components/ui/BottomSheet'));
import { buscarEventoPorPIN } from '../../js/firestore.js';

const HeroPage: React.FC = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();

  // Inicializar video de fondo
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      
      video.play().catch((err) => {
        console.log('Autoplay bloqueado:', err);
        const playVideo = () => {
          video.play().catch(() => {});
        };
        document.addEventListener('click', playVideo, { once: true });
        document.addEventListener('touchstart', playVideo, { once: true, passive: true });
      });
    }
  }, []);

  // Validar PIN (solo números, máximo 5 dígitos)
  const handlePINChange = (value: string) => {
    // Solo permitir números
    const numbersOnly = value.replace(/[^0-9]/g, '');
    // Limitar a 5 dígitos
    const limited = numbersOnly.substring(0, 5);
    setPin(limited);
    setError(''); // Limpiar error al escribir
  };

  // Buscar evento por PIN
  const handleBuscarEvento = async (pinValue: string): Promise<void> => {
    if (pinValue.length !== 5) {
      setError('El PIN debe tener 5 dígitos');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Buscar evento (usando importación estática que funciona con Vite)
      const resultado = await buscarEventoPorPIN(pinValue);

      if (resultado && resultado.ok && resultado.data) {
        const evento = resultado.data as any;
        navigate(`/participar?pin=${pinValue}&evento=${evento.id || pinValue}`);
      } else {
        setError('PIN no encontrado. Por favor, verifica el código.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Error al buscar evento:', err);
      setError('Error al buscar el evento. Por favor, intenta nuevamente.');
      setLoading(false);
    }
  };

  // Handler para cuando se completa el slide
  const handleSlideComplete = async (): Promise<void> => {
    await handleBuscarEvento(pin);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      {/* Video de fondo */}
      <video 
        ref={videoRef}
        id="backgroundVideo"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/images/hero-wine.mp4" type="video/mp4" />
      </video>
      
      {/* Overlay oscuro para mejorar legibilidad */}
      <div className="absolute inset-0 bg-black/30 z-[1]"></div>
      
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 relative z-[10] border-b border-gray-200/50 backdrop-blur-sm">
        {/* Logo */}
        <img src="/images/logo-pinot.png" alt="Pinot" className="h-12 w-auto" />
        
        {/* Menú hamburguesa - BottomSheet maneja el click internamente en su useEffect */}
        <button 
          id="menuToggle"
          className="p-3 text-white hover:text-white/80 transition-colors"
          aria-label="Menú"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>
      
      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col justify-end px-6 py-8 pb-24 items-center relative z-[10]">
        {/* Título de bienvenida */}
        <h1 className="pinot-hero-title text-5xl font-bold mb-8 text-center">
          ¡Bienvenido!
        </h1>
        
        {/* Campo PIN */}
        <div className="relative w-full mb-6">
          <input 
            ref={pinInputRef}
            type="text" 
            id="pinInput"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={5}
            placeholder="PIN del evento"
            value={pin}
            onChange={(e) => handlePINChange(e.target.value)}
            onPaste={(e) => {
              e.preventDefault();
              const pastedText = (e.clipboardData || window.clipboardData).getData('text');
              const numbersOnly = pastedText.replace(/[^0-9]/g, '').substring(0, 5);
              handlePINChange(numbersOnly);
            }}
            className="pinot-input-pin w-full px-6 py-8 text-center"
            autoComplete="off"
          />
        </div>
        
        {/* Mensaje de error */}
        {error && (
          <p className="text-red-500 text-sm mb-6">{error}</p>
        )}
        
        {/* Slide/Switch Unirme al evento */}
        <div className="relative w-full">
          <SlideButton 
            pin={pin}
            onSlideComplete={handleSlideComplete}
            loading={loading}
          />
        </div>
        
        {/* Texto explicativo */}
        <p className="text-white/40 text-sm mt-6 text-center">
          El organizador del evento te proporcionará el PIN
        </p>
      </main>
      
      {/* Navegación Inferior */}
      <BottomNavigation />
      
      {/* Bottom Sheet */}
      <Suspense fallback={null}>
        <BottomSheet />
      </Suspense>
    </div>
  );
};

export default HeroPage;


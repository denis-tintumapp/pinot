/**
 * Slide Button Component
 * Botón de deslizamiento para unirse a un evento
 * Migrado desde slide-button.js
 */

import React, { useState, useEffect, useRef } from 'react';

interface SlideButtonProps {
  pin: string;
  onSlideComplete: () => Promise<void>;
  loading?: boolean;
}

const SlideButton: React.FC<SlideButtonProps> = ({ pin, onSlideComplete, loading = false }) => {
  const [thumbPosition, setThumbPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const thumbWidth = 96; // 6rem = 96px
  const maxPosition = containerWidth - thumbWidth;
  const progress = maxPosition > 0 ? thumbPosition / maxPosition : 0;
  const isValid = pin.length === 5 && /^\d+$/.test(pin);
  const isActive = progress >= 0.9;

  // Actualizar dimensiones del contenedor
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Función para actualizar posición del thumb
  const updateThumbPosition = (x: number, smooth = false) => {
    const newPosition = Math.max(0, Math.min(x, maxPosition));
    setThumbPosition(newPosition);
  };

  // Función para resetear el slide
  const resetSlide = (smooth = true) => {
    setThumbPosition(0);
    setIsDragging(false);
  };

  // Función para completar el slide
  const completeSlide = async () => {
    if (progress >= 0.9 && isValid && !loading) {
      try {
        await onSlideComplete();
        // Reset después de completar
        setTimeout(() => {
          resetSlide(true);
        }, 2000);
      } catch (error) {
        // Si hay error, resetear
        resetSlide(true);
      }
    } else {
      // No completado o PIN inválido, volver a inicio
      resetSlide(true);
    }
  };

  // Iniciar arrastre
  const startDrag = (clientX: number) => {
    if (!isValid || loading) return false;
    setIsDragging(true);
    setStartX(clientX - thumbPosition);
    return true;
  };

  // Actualizar durante el arrastre
  const updateDrag = (clientX: number) => {
    if (!isDragging) return;
    const newX = clientX - startX;
    updateThumbPosition(newX, false);
  };

  // Finalizar arrastre
  const endDrag = () => {
    if (!isDragging) return;
    setIsDragging(false);
    completeSlide();
  };

  // Event handlers para mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isValid || loading) return;
    if (startDrag(e.clientX)) {
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    updateDrag(e.clientX);
  };

  const handleMouseUp = () => {
    endDrag();
  };

  // Event handlers para touch
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isValid || loading) return;
    // Solo prevenir default si realmente vamos a iniciar el drag
    if (startDrag(e.touches[0].clientX)) {
      // No prevenir default aquí - el listener global lo manejará
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging) {
      updateDrag(e.touches[0].clientX);
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      endDrag();
    }
  };

  // Agregar event listeners globales cuando se está arrastrando
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // touchmove debe ser non-passive para poder usar preventDefault
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd, { passive: true });
      document.addEventListener('touchcancel', handleTouchEnd, { passive: true });

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('touchcancel', handleTouchEnd);
      };
    }
  }, [isDragging, startX, thumbPosition]);

  // Label text basado en progreso
  const getLabelText = () => {
    if (loading) return 'Verificando...';
    if (isActive) return '¡Suelta para unirte!';
    return 'Desliza para unirte';
  };

  const labelOpacity = isActive || loading ? 1 : Math.max(0, 1 - (progress * 1.5));

  return (
    <div
      ref={containerRef}
      className={`pinot-slide-container relative w-full h-24 rounded-full cursor-pointer transition-all duration-300 overflow-hidden ${
        !isValid || loading ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
      } ${isActive ? 'active' : ''}`}
    >
      <div className="pinot-slide-track absolute inset-0 flex items-center justify-end px-4">
        <div
          ref={thumbRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className="pinot-slide-thumb absolute left-0 top-0 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ease-out z-20 cursor-grab active:cursor-grabbing"
          style={{
            left: `${thumbPosition}px`,
            transition: isDragging ? 'none' : 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <svg className="w-6 h-6 text-gray-800 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <span
          className="z-10 transition-all duration-300"
          style={{ opacity: labelOpacity }}
        >
          {getLabelText()}
        </span>
      </div>
    </div>
  );
};

export default SlideButton;


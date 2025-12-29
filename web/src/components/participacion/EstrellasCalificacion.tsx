/**
 * Componente para calificar etiquetas con estrellas (interactivo)
 * Mejorado con soporte táctil y preview en hover
 */

import React, { useState, useCallback } from 'react';

interface EstrellasCalificacionProps {
  etiquetaId: string;
  calificacion: number;
  onCalificar: (etiquetaId: string, calificacion: number) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const EstrellasCalificacion: React.FC<EstrellasCalificacionProps> = ({
  etiquetaId,
  calificacion,
  onCalificar,
  disabled = false,
  size = 'medium'
}) => {
  const [previewRating, setPreviewRating] = useState<number | null>(null);
  const [touchState, setTouchState] = useState<{
    startTime: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  const sizeMap = {
    small: '16',
    medium: '20',
    large: '24'
  };
  const starSize = sizeMap[size];

  const ratingToShow = previewRating !== null ? previewRating : calificacion;

  const handleCalificar = useCallback(
    (rating: number, e?: React.MouseEvent | React.TouchEvent) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      if (!disabled) {
        onCalificar(etiquetaId, rating);
      }
    },
    [etiquetaId, onCalificar, disabled]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, rating: number) => {
      const touch = e.touches[0];
      setTouchState({
        startTime: Date.now(),
        startX: touch.clientX,
        startY: touch.clientY,
        moved: false
      });
      e.stopPropagation();
    },
    []
  );

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchState && e.touches.length > 0) {
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchState.startX);
      const deltaY = Math.abs(touch.clientY - touchState.startY);
      if (deltaX > 15 || deltaY > 15) {
        setTouchState((prev) => prev ? { ...prev, moved: true } : null);
      }
    }
  }, [touchState]);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent, rating: number) => {
      e.stopPropagation();
      e.preventDefault();

      if (touchState && !touchState.moved && Date.now() - touchState.startTime < 500) {
        handleCalificar(rating, e);
      }

      setTouchState(null);
    },
    [touchState, handleCalificar]
  );

  const handleTouchCancel = useCallback((e: React.TouchEvent) => {
    setTouchState(null);
    e.stopPropagation();
  }, []);

  const handleMouseEnter = useCallback((rating: number) => {
    if (!disabled) {
      setPreviewRating(rating);
    }
  }, [disabled]);

  const handleMouseLeave = useCallback(() => {
    setPreviewRating(null);
  }, []);

  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  };

  return (
    <div
      className="flex items-center gap-1 mt-2"
      onMouseLeave={handleMouseLeave}
      style={{ touchAction: 'manipulation' }}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={disabled}
          className={`focus:outline-none transition-transform ${
            !disabled ? 'hover:scale-110 cursor-pointer' : 'cursor-not-allowed opacity-50'
          }`}
          style={{
            touchAction: 'manipulation',
            pointerEvents: disabled ? 'none' : 'auto',
            padding: '4px',
            margin: 0,
            border: 'none',
            background: 'transparent'
          }}
          onClick={(e) => handleCalificar(i, e)}
          onMouseEnter={() => !isMobile() && handleMouseEnter(i)}
          onTouchStart={(e) => handleTouchStart(e, i)}
          onTouchMove={handleTouchMove}
          onTouchEnd={(e) => handleTouchEnd(e, i)}
          onTouchCancel={handleTouchCancel}
          aria-label={`Calificar con ${i} estrella${i > 1 ? 's' : ''}`}
        >
          <svg
            width={starSize}
            height={starSize}
            viewBox="0 0 24 24"
            fill={i <= ratingToShow ? '#fbbf24' : 'none'}
            stroke="#fbbf24"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={i <= ratingToShow ? 'text-yellow-400' : 'text-gray-300'}
            style={{ pointerEvents: 'none' }}
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
};

export default EstrellasCalificacion;

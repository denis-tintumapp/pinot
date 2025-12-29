/**
 * Componente para mostrar estrellas de calificación (solo lectura)
 */

import React from 'react';

interface EstrellasCalificacionProps {
  calificacion: number;
  size?: 'small' | 'medium' | 'large';
}

const EstrellasCalificacion: React.FC<EstrellasCalificacionProps> = ({
  calificacion,
  size = 'small'
}) => {
  const calificacionNum = calificacion || 0;
  const sizeMap = {
    small: '14',
    medium: '18',
    large: '24'
  };
  const starSize = sizeMap[size];

  return (
    <div className="flex items-center justify-center gap-0.5 mt-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width={starSize}
          height={starSize}
          viewBox="0 0 24 24"
          fill={i <= calificacionNum ? '#fbbf24' : 'none'}
          stroke="#fbbf24"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
};

export default EstrellasCalificacion;












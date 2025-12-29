/**
 * Componente para mostrar errores de formulario
 */

import React from 'react';

interface FormErrorProps {
  message: string;
  type?: 'error' | 'success' | 'info';
  className?: string;
}

export function FormError({ message, type = 'error', className = '' }: FormErrorProps) {
  if (!message) return null;

  const typeClasses = {
    error: 'bg-red-500/20 border-red-500/50 text-red-200',
    success: 'bg-green-500/20 border-green-500/50 text-green-200',
    info: 'bg-blue-500/20 border-blue-500/50 text-blue-200',
  };

  const icons = {
    error: '✗',
    success: '✓',
    info: 'ℹ',
  };

  const iconColors = {
    error: 'text-red-400',
    success: 'text-green-400',
    info: 'text-blue-400',
  };

  return (
    <div
      className={`border rounded-lg p-4 text-sm animate-fade-in ${typeClasses[type]} ${className}`}
    >
      <div className="flex items-start gap-2">
        <span className={`text-lg ${iconColors[type]}`}>{icons[type]}</span>
        <span>{message}</span>
      </div>
    </div>
  );
}


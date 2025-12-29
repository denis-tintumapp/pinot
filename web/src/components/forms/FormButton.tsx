/**
 * Componente de Botón reutilizable para formularios
 */

import React from 'react';

interface FormButtonProps {
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export function FormButton({
  type = 'submit',
  disabled = false,
  loading = false,
  loadingText,
  children,
  className = '',
  onClick,
  variant = 'primary',
}: FormButtonProps) {
  const variantClasses = {
    primary: 'bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800',
    secondary: 'bg-white/20 hover:bg-white/30 border border-white/30',
    danger: 'bg-red-600 hover:bg-red-700',
  };

  const baseClasses = `w-full text-white font-semibold py-3 rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${variantClasses[variant]} ${className}`;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={baseClasses}
    >
      {loading && (
        <div className="spinner border-white/30 border-t-white w-5 h-5"></div>
      )}
      <span>{loading ? (loadingText || 'Cargando...') : children}</span>
    </button>
  );
}


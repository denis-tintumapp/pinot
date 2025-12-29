/**
 * Componente de Textarea reutilizable con React Hook Form
 */

import React from 'react';
import { UseFormRegister, FieldError, Path } from 'react-hook-form';

interface FormTextareaProps<T extends Record<string, any>> {
  label: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  error?: FieldError;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
  showCharCount?: boolean;
  value?: string;
  className?: string;
}

export function FormTextarea<T extends Record<string, any>>({
  label,
  name,
  register,
  error,
  required = false,
  placeholder,
  disabled = false,
  rows = 4,
  maxLength,
  showCharCount = false,
  value,
  className = '',
}: FormTextareaProps<T>) {
  const inputId = `textarea-${name}`;
  const hasError = !!error;
  const charCount = value?.length || 0;

  const baseClasses = `w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/50 border transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed resize-none ${
    hasError
      ? 'border-red-400/50 focus:ring-red-400/50 focus:border-red-400/50'
      : 'border-white/30 focus:ring-white/50 focus:border-white/50'
  } ${className}`;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label htmlFor={inputId} className="block text-white font-medium">
          {label} {required && <span className="text-red-300">*</span>}
        </label>
        {showCharCount && maxLength && (
          <span className="text-xs text-white/60">
            {charCount}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        id={inputId}
        {...register(name)}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        value={value}
        className={baseClasses}
      />
      {error && (
        <p className="text-red-300 text-xs mt-1 animate-fade-in">
          {error.message}
        </p>
      )}
    </div>
  );
}


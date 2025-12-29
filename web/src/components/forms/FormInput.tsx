/**
 * Componente de Input reutilizable con React Hook Form
 */

import React from 'react';
import { UseFormRegister, FieldError, Path } from 'react-hook-form';

interface FormInputProps<T extends Record<string, any>> {
  label: string;
  name: Path<T>;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  register: UseFormRegister<T>;
  error?: FieldError;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
  className?: string;
  maxLength?: number;
  showCharCount?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FormInput<T extends Record<string, any>>({
  label,
  name,
  type = 'text',
  register,
  error,
  required = false,
  placeholder,
  disabled = false,
  autoComplete,
  className = '',
  maxLength,
  showCharCount = false,
  value,
  onChange,
}: FormInputProps<T>) {
  const inputId = `input-${name}`;
  const hasError = !!error;
  const charCount = value?.length || 0;

  const baseClasses = `w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/50 border transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
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
      <div className="relative">
        <input
          id={inputId}
          type={type}
          {...register(name)}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          maxLength={maxLength}
          className={baseClasses}
        />
        {!hasError && value && value.length > 0 && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-green-400">
            ✓
          </span>
        )}
        {hasError && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-red-400">
            ✗
          </span>
        )}
      </div>
      {error && (
        <p className="text-red-300 text-xs mt-1 animate-fade-in">
          {error.message}
        </p>
      )}
    </div>
  );
}


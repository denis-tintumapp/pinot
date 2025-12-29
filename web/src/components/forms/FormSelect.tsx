/**
 * Componente de Select reutilizable con React Hook Form
 */

import React from 'react';
import { UseFormRegister, FieldError, Path } from 'react-hook-form';

interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps<T extends Record<string, any>> {
  label: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  error?: FieldError;
  required?: boolean;
  options: SelectOption[];
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function FormSelect<T extends Record<string, any>>({
  label,
  name,
  register,
  error,
  required = false,
  options,
  disabled = false,
  className = '',
  placeholder,
}: FormSelectProps<T>) {
  const inputId = `select-${name}`;
  const hasError = !!error;

  const baseClasses = `w-full px-4 py-3 rounded-lg bg-white/20 text-white border transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
    hasError
      ? 'border-red-400/50 focus:ring-red-400/50 focus:border-red-400/50'
      : 'border-white/30 focus:ring-white/50 focus:border-white/50'
  } ${className}`;

  return (
    <div>
      <label htmlFor={inputId} className="block text-white font-medium mb-2">
        {label} {required && <span className="text-red-300">*</span>}
      </label>
      <select
        id={inputId}
        {...register(name)}
        required={required}
        disabled={disabled}
        className={baseClasses}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} className="text-gray-900">
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-red-300 text-xs mt-1 animate-fade-in">
          {error.message}
        </p>
      )}
    </div>
  );
}


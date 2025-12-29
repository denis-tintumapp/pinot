/**
 * Componente especializado para entrada de PIN con animación
 * Compatible con React Hook Form
 */

import React, { useEffect, useRef, useState } from 'react';
import { UseFormRegister, FieldError, Path } from 'react-hook-form';

interface PinInputProps<T extends Record<string, any>> {
  name: Path<T>;
  register: UseFormRegister<T>;
  error?: FieldError;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function PinInput<T extends Record<string, any>>({
  name,
  register,
  error,
  disabled = false,
  onValueChange,
  className = '',
}: PinInputProps<T>) {
  const [pin, setPin] = useState('');
  const [showAnimation, setShowAnimation] = useState(true);
  const [animationPin, setAnimationPin] = useState('00000');
  const [currentDigitIndex, setCurrentDigitIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Iniciar animación cuando el campo está vacío y sin focus
  useEffect(() => {
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }

    if (showAnimation && pin === '') {
      const generateRandomPIN = () => {
        return Math.floor(10000 + Math.random() * 90000).toString();
      };

      const updateAnimation = () => {
        const randomPin = generateRandomPIN();
        setAnimationPin(randomPin);
        setCurrentDigitIndex((prev) => (prev + 1) % 5);
      };

      updateAnimation();
      
      animationIntervalRef.current = setInterval(() => {
        updateAnimation();
      }, 2000);
    }

    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }
    };
  }, [showAnimation, pin]);

  // Iniciar animación después de un delay inicial
  useEffect(() => {
    if (pin === '') {
      const timer = setTimeout(() => {
        setShowAnimation(true);
      }, 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [pin]);

  const handleFocus = () => {
    setShowAnimation(false);
  };

  const handleBlur = () => {
    if (pin === '') {
      setCurrentDigitIndex(0);
      setShowAnimation(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '').substring(0, 5);
    setPin(value);
    if (onValueChange) {
      onValueChange(value);
    }
    if (value === '') {
      setShowAnimation(true);
    } else {
      setShowAnimation(false);
    }
  };

  const { onChange, ...registerProps } = register(name, {
    onChange: handleChange,
  });

  const hasError = !!error;

  return (
    <div className={`relative w-full ${className}`}>
      <input
        ref={(e) => {
          inputRef.current = e;
          registerProps.ref(e);
        }}
        type="text"
        value={pin}
        onChange={(e) => {
          onChange(e);
          handleChange(e);
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyPress={(e) => {
          if (e.key === 'Enter' && pin.length === 5) {
            e.currentTarget.form?.requestSubmit();
          }
        }}
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={5}
        placeholder=""
        disabled={disabled}
        className={`w-full px-6 py-4 bg-gray-900 border-2 rounded-lg text-center text-4xl font-bold text-white focus:outline-none focus:border-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          hasError ? 'border-red-500' : 'border-gray-700'
        }`}
        style={{ letterSpacing: '0.5rem' }}
        autoComplete="off"
        required
      />
      {/* Overlay para mostrar animación con subrayado */}
      {showAnimation && pin === '' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div
            className="text-4xl font-bold text-white/40"
            style={{ letterSpacing: '0.5rem' }}
          >
            {animationPin.split('').map((digit, index) => (
              <span
                key={index}
                className={
                  index === currentDigitIndex
                    ? 'underline decoration-white/60 decoration-2 underline-offset-4'
                    : ''
                }
              >
                {digit}
              </span>
            ))}
          </div>
        </div>
      )}
      {error && (
        <p className="text-white text-sm text-center mt-2 drop-shadow-lg">{error.message}</p>
      )}
    </div>
  );
}


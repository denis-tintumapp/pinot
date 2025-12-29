/**
 * Componente para proteger rutas que requieren autenticación
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Mostrar loading mientras se verifica la autenticación
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner-border inline-block w-8 h-8 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirigir a login con la ruta actual como redirect
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return children;
};












/**
 * Componente de login para el panel de administración
 */

import React, { useState } from 'react';
import { useAdminAuth } from '../../hooks/useAdminAuth';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const { login } = useAdminAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const resultado = await login(password);
    if (resultado.success) {
      onLoginSuccess();
    } else {
      setError(resultado.error || 'Contraseña incorrecta');
      setPassword('');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#3b0764' }}>
      <div className="rounded-xl p-8 shadow-2xl border w-full max-w-md backdrop-blur-sm" style={{ backgroundColor: 'rgba(88, 28, 135, 0.8)', borderColor: 'rgba(107, 33, 168, 0.5)' }}>
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-0.5">
            <img src="/images/logo-pinot.png" alt="Pinot Logo" className="w-full max-w-[560px]" />
          </div>
          <p className="text-white text-lg font-semibold">Panel de Administración</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="adminPassword" className="block text-white font-semibold mb-2">
              Contraseña de Superusuario
            </label>
            <input
              type="password"
              id="adminPassword"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Ingresa la contraseña"
              className="w-full px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 transition-all"
              style={{ 
                backgroundColor: 'rgba(107, 33, 168, 0.6)', 
                borderColor: 'rgba(126, 34, 206, 0.5)',
                borderWidth: '1px',
                borderStyle: 'solid'
              }}
              autoComplete="off"
              autoFocus
              disabled={loading}
            />
            <p className="text-xs mt-1" style={{ color: '#e9d5ff' }}>
              Contraseña por defecto: <code className="px-1 rounded text-white font-mono" style={{ backgroundColor: 'rgba(107, 33, 168, 0.6)' }}>PinotAdmin</code>
            </p>
          </div>

          {error && (
            <div className="text-sm font-semibold border-2 rounded-lg p-3" style={{ color: '#fecaca', backgroundColor: 'rgba(127, 29, 29, 0.7)', borderColor: '#dc2626' }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-semibold py-3 rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#9333ea' }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#7e22ce')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#9333ea')}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;












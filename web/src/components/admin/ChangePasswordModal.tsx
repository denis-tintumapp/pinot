/**
 * Modal para cambiar contraseña del administrador
 */

import React, { useState } from 'react';
import { useAdminAuth } from '../../hooks/useAdminAuth';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { cambiarPassword } = useAdminAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    const resultado = await cambiarPassword(currentPassword, newPassword);
    setLoading(false);

    if (resultado.success) {
      setSuccess('Contraseña actualizada correctamente');
      setTimeout(() => {
        onClose();
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccess(null);
      }, 2000);
    } else {
      setError(resultado.error || 'Error al actualizar la contraseña');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-purple-900/95 rounded-xl shadow-2xl border border-purple-700/50 max-w-md w-full p-6 backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-white mb-4">Cambiar Contraseña</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-white font-semibold mb-2">
              Contraseña Actual
            </label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-purple-800/60 text-white placeholder-purple-300/60 border border-purple-700/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-white font-semibold mb-2">
              Nueva Contraseña
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-lg bg-purple-800/60 text-white placeholder-purple-300/60 border border-purple-700/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all"
            />
            <p className="text-xs text-purple-200 mt-1">Mínimo 6 caracteres</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-white font-semibold mb-2">
              Confirmar Nueva Contraseña
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-lg bg-purple-800/60 text-white placeholder-purple-300/60 border border-purple-700/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all"
            />
          </div>

          {error && (
            <div className="text-red-200 text-sm font-semibold bg-red-900/70 border-2 border-red-600 rounded-lg p-3">{error}</div>
          )}

          {success && (
            <div className="text-green-200 text-sm font-semibold bg-green-900/70 border-2 border-green-600 rounded-lg p-3">{success}</div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 text-white font-semibold py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 shadow-md"
            >
              {loading ? 'Actualizando...' : 'Actualizar'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-purple-800/60 text-white font-semibold py-3 rounded-lg hover:bg-purple-700/80 transition-colors border border-purple-600/50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;












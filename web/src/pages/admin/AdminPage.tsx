/**
 * Página de Administración
 * Migración desde adminpanel/admin.html
 * Panel completo de administración con tabs para Anfitriones, Participantes, Eventos y Etiquetas
 */

import React, { useState, useEffect, Fragment } from 'react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { useAdminAnfitriones } from '../../hooks/useAdminAnfitriones';
import { useAdminParticipantes } from '../../hooks/useAdminParticipantes';
import { useAdminEventos } from '../../hooks/useAdminEventos';
import { useAdminEtiquetas } from '../../hooks/useAdminEtiquetas';
import AdminLogin from '../../components/admin/AdminLogin';
import ChangePasswordModal from '../../components/admin/ChangePasswordModal';

type TabType = 'anfitriones' | 'participantes' | 'eventos' | 'etiquetas';

// Componente para fila de anfitrión con expand/collapse y edición
const AnfitrionRow: React.FC<{
  anfitrion: any;
  isExpanded: boolean;
  isEditing: boolean;
  onToggleExpand: () => void;
  onToggleEdit: () => void;
  onSave: (datos: any) => void;
  onDelete: () => void;
  onDeshabilitar: () => void;
  onHabilitar: () => void;
  formatearFecha: (fecha: any) => string;
}> = ({ anfitrion, isExpanded, isEditing, onToggleExpand, onToggleEdit, onSave, onDelete, onDeshabilitar, onHabilitar, formatearFecha }) => {
  const [editAlias, setEditAlias] = useState(anfitrion.alias || anfitrion.nombreAnfitrion || '');
  const [editEmail, setEditEmail] = useState(anfitrion.email || '');

  useEffect(() => {
    if (isEditing) {
      setEditAlias(anfitrion.alias || anfitrion.nombreAnfitrion || '');
      setEditEmail(anfitrion.email || '');
    }
  }, [isEditing, anfitrion]);

  const estaHabilitado = anfitrion.habilitado !== false; // Por defecto true si no existe

  return (
    <>
      <tr className={`transition-colors ${!estaHabilitado ? 'opacity-60' : ''}`} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(107, 33, 168, 0.4)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
        <td className="px-2 md:px-4 py-2 md:py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleExpand}
              className="text-purple-300 hover:text-white transition-colors text-xs"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
            <div className={`text-sm font-medium ${estaHabilitado ? 'text-white' : 'text-gray-400'}`}>
              {anfitrion.alias || anfitrion.nombreAnfitrion || 'Sin alias'}
            </div>
            {!estaHabilitado && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300 border border-gray-600">
                Deshabilitado
              </span>
            )}
          </div>
          <div className="text-xs text-purple-300/70 font-mono md:hidden mt-1">{anfitrion.id.substring(0, 8)}...</div>
          <div className="text-xs text-purple-300/70 md:hidden mt-1">{anfitrion.email || 'Sin email'}</div>
        </td>
        <td className="px-2 md:px-4 py-2 md:py-3 text-sm text-purple-100 hidden md:table-cell">{anfitrion.email || 'Sin email'}</td>
        <td className="px-2 md:px-4 py-2 md:py-3 text-sm">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            anfitrion.tipo === 'efimero' ? 'bg-blue-900/50 text-blue-300 border border-blue-700' : 'bg-amber-900/50 text-amber-300 border border-amber-700'
          }`}>
            {anfitrion.tipo === 'efimero' ? 'Efímero' : 'Persistente'}
          </span>
        </td>
        <td className="px-2 md:px-4 py-2 md:py-3 text-sm hidden sm:table-cell">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            anfitrion.emailVerificado ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-yellow-900/50 text-yellow-300 border border-yellow-700'
          }`}>
            {anfitrion.emailVerificado ? 'Sí' : 'No'}
          </span>
        </td>
        <td className="px-2 md:px-4 py-2 md:py-3 text-sm text-purple-100 hidden lg:table-cell">{anfitrion.eventosCreados || 0}</td>
        <td className="px-2 md:px-4 py-2 md:py-3 text-sm">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={onToggleEdit}
              className="text-blue-400 hover:text-blue-300 transition-colors text-xs md:text-sm font-medium"
              disabled={!estaHabilitado && !isEditing}
            >
              {isEditing ? 'Cancelar' : 'Editar'}
            </button>
            {estaHabilitado ? (
              <button
                onClick={onDeshabilitar}
                className="text-orange-400 hover:text-orange-300 transition-colors text-xs md:text-sm font-medium"
              >
                Deshabilitar
              </button>
            ) : (
              <button
                onClick={onHabilitar}
                className="text-green-400 hover:text-green-300 transition-colors text-xs md:text-sm font-medium"
              >
                Habilitar
              </button>
            )}
            <button
              onClick={onDelete}
              className="text-red-400 hover:text-red-300 transition-colors text-xs md:text-sm font-medium"
            >
              Eliminar
            </button>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={6} className="px-2 md:px-4 py-3" style={{ backgroundColor: 'rgba(107, 33, 168, 0.3)' }}>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-purple-200 mb-1">Alias/Nombre</label>
                  <input
                    type="text"
                    value={editAlias}
                    onChange={(e) => setEditAlias(e.target.value)}
                    className="w-full px-3 py-2 rounded text-sm text-white border" style={{ backgroundColor: 'rgba(88, 28, 135, 0.6)', borderColor: 'rgba(147, 51, 234, 0.5)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-purple-200 mb-1">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded text-sm text-white border" style={{ backgroundColor: 'rgba(88, 28, 135, 0.6)', borderColor: 'rgba(147, 51, 234, 0.5)' }}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onSave({ alias: editAlias, nombreAnfitrion: editAlias, email: editEmail })}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={onToggleEdit}
                    className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-purple-200 space-y-1">
                <div><strong>ID:</strong> <span className="font-mono">{anfitrion.id}</span></div>
                <div><strong>Email:</strong> {anfitrion.email || 'N/A'}</div>
                <div><strong>Alias:</strong> {anfitrion.alias || 'N/A'}</div>
                <div><strong>Nombre Completo:</strong> {anfitrion.nombreCompleto || 'N/A'}</div>
                <div><strong>Tipo:</strong> {anfitrion.tipo || 'N/A'}</div>
                <div><strong>Email Verificado:</strong> {anfitrion.emailVerificado ? 'Sí' : 'No'}</div>
                <div><strong>Eventos Creados:</strong> {anfitrion.eventosCreados || 0}</div>
                <div><strong>Creado:</strong> {formatearFecha(anfitrion.creadoEn)}</div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
};

// Componente para fila de participante con expand/collapse y edición
const ParticipanteRow: React.FC<{
  participante: any;
  isExpanded: boolean;
  isEditing: boolean;
  onToggleExpand: () => void;
  onToggleEdit: () => void;
  onSave: (datos: any) => void;
  onDelete: () => void;
  onDeshabilitar: () => void;
  onHabilitar: () => void;
  formatearFecha: (fecha: any) => string;
}> = ({ participante, isExpanded, isEditing, onToggleExpand, onToggleEdit, onSave, onDelete, onDeshabilitar, onHabilitar, formatearFecha }) => {
  const [editNombre, setEditNombre] = useState(participante.nombre || '');

  useEffect(() => {
    if (isEditing) {
      setEditNombre(participante.nombre || '');
    }
  }, [isEditing, participante]);

  const estaHabilitado = participante.habilitado !== false; // Por defecto true si no existe

  return (
    <>
      <tr className={`transition-colors ${!estaHabilitado ? 'opacity-60' : ''}`} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(107, 33, 168, 0.4)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
        <td className="px-2 md:px-4 py-2 md:py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleExpand}
              className="text-purple-300 hover:text-white transition-colors text-xs"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
            <div className={`text-sm font-medium ${estaHabilitado ? 'text-white' : 'text-gray-400'}`}>
              {participante.nombre || 'Sin nombre'}
            </div>
            {!estaHabilitado && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300 border border-gray-600">
                Deshabilitado
              </span>
            )}
          </div>
          <div className="text-xs text-purple-300/70 font-mono md:hidden mt-1">{participante.eventoId?.substring(0, 8) || 'N/A'}...</div>
          <div className="text-xs text-purple-300/70 md:hidden mt-1">{formatearFecha(participante.creadoEn)}</div>
        </td>
        <td className="px-2 md:px-4 py-2 md:py-3 text-sm text-purple-100 font-mono hidden sm:table-cell">{participante.eventoId?.substring(0, 8) || 'N/A'}...</td>
        <td className="px-2 md:px-4 py-2 md:py-3 text-sm text-purple-200 hidden md:table-cell">{formatearFecha(participante.creadoEn)}</td>
        <td className="px-2 md:px-4 py-2 md:py-3 text-sm">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={onToggleEdit}
              className="text-blue-400 hover:text-blue-300 transition-colors text-xs md:text-sm font-medium"
              disabled={!estaHabilitado && !isEditing}
            >
              {isEditing ? 'Cancelar' : 'Editar'}
            </button>
            {estaHabilitado ? (
              <button
                onClick={onDeshabilitar}
                className="text-orange-400 hover:text-orange-300 transition-colors text-xs md:text-sm font-medium"
              >
                Deshabilitar
              </button>
            ) : (
              <button
                onClick={onHabilitar}
                className="text-green-400 hover:text-green-300 transition-colors text-xs md:text-sm font-medium"
              >
                Habilitar
              </button>
            )}
            <button
              onClick={onDelete}
              className="text-red-400 hover:text-red-300 transition-colors text-xs md:text-sm font-medium"
            >
              Eliminar
            </button>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={4} className="px-2 md:px-4 py-3" style={{ backgroundColor: 'rgba(107, 33, 168, 0.3)' }}>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-purple-200 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    className="w-full px-3 py-2 rounded text-sm text-white border" style={{ backgroundColor: 'rgba(88, 28, 135, 0.6)', borderColor: 'rgba(147, 51, 234, 0.5)' }}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onSave({ nombre: editNombre })}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={onToggleEdit}
                    className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-purple-200 space-y-1">
                <div><strong>ID:</strong> <span className="font-mono">{participante.id}</span></div>
                <div><strong>Nombre:</strong> {participante.nombre || 'N/A'}</div>
                <div><strong>Evento ID:</strong> <span className="font-mono">{participante.eventoId || 'N/A'}</span></div>
                <div><strong>Creado:</strong> {formatearFecha(participante.creadoEn)}</div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
};

// Componente para fila de evento con expand/collapse y edición
const EventoRow: React.FC<{
  evento: any;
  isExpanded: boolean;
  isEditing: boolean;
  onToggleExpand: () => void;
  onToggleEdit: () => void;
  onSave: (datos: any) => void;
  onDelete: () => void;
  onDeshabilitar: () => void;
  onHabilitar: () => void;
  formatearFecha: (fecha: any) => string;
}> = ({ evento, isExpanded, isEditing, onToggleExpand, onToggleEdit, onSave, onDelete, onDeshabilitar, onHabilitar, formatearFecha }) => {
  const [editNombre, setEditNombre] = useState(evento.nombre || '');

  useEffect(() => {
    if (isEditing) {
      setEditNombre(evento.nombre || '');
    }
  }, [isEditing, evento]);

  const estaHabilitado = evento.habilitado !== false; // Por defecto true si no existe

  return (
    <>
      <tr className={`transition-colors ${!estaHabilitado ? 'opacity-60' : ''}`} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(107, 33, 168, 0.4)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
        <td className="px-2 md:px-4 py-2 md:py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleExpand}
              className="text-purple-300 hover:text-white transition-colors text-xs"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
            <div className={`text-sm font-medium ${estaHabilitado ? 'text-white' : 'text-gray-400'}`}>
              {evento.nombre || 'Sin nombre'}
            </div>
            {!estaHabilitado && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300 border border-gray-600">
                Deshabilitado
              </span>
            )}
          </div>
          <div className="text-xs text-purple-300/70 font-mono md:hidden mt-1">{evento.id.substring(0, 8)}...</div>
          <div className="text-xs text-purple-300/70 md:hidden mt-1">Etiquetas: {evento.cantidadEtiquetas || 0}</div>
        </td>
        <td className="px-2 md:px-4 py-2 md:py-3 text-sm text-purple-100 font-mono">{evento.pin || 'N/A'}</td>
        <td className="px-2 md:px-4 py-2 md:py-3 text-sm">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            evento.activo ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-yellow-900/50 text-yellow-300 border border-yellow-700'
          }`}>
            {evento.activo ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td className="px-2 md:px-4 py-2 md:py-3 text-sm text-purple-100 hidden sm:table-cell">{evento.cantidadParticipantes || 0}</td>
        <td className="px-2 md:px-4 py-2 md:py-3 text-sm text-purple-100 hidden md:table-cell">{evento.cantidadEtiquetas || 0}</td>
        <td className="px-2 md:px-4 py-2 md:py-3 text-sm">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={onToggleEdit}
              className="text-blue-400 hover:text-blue-300 transition-colors text-xs md:text-sm font-medium"
              disabled={!estaHabilitado && !isEditing}
            >
              {isEditing ? 'Cancelar' : 'Editar'}
            </button>
            {estaHabilitado ? (
              <button
                onClick={onDeshabilitar}
                className="text-orange-400 hover:text-orange-300 transition-colors text-xs md:text-sm font-medium"
              >
                Deshabilitar
              </button>
            ) : (
              <button
                onClick={onHabilitar}
                className="text-green-400 hover:text-green-300 transition-colors text-xs md:text-sm font-medium"
              >
                Habilitar
              </button>
            )}
            <button
              onClick={onDelete}
              className="text-red-400 hover:text-red-300 transition-colors text-xs md:text-sm font-medium"
            >
              Eliminar
            </button>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={6} className="px-2 md:px-4 py-3" style={{ backgroundColor: 'rgba(107, 33, 168, 0.3)' }}>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-purple-200 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    className="w-full px-3 py-2 rounded text-sm text-white border" style={{ backgroundColor: 'rgba(88, 28, 135, 0.6)', borderColor: 'rgba(147, 51, 234, 0.5)' }}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onSave({ nombre: editNombre })}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={onToggleEdit}
                    className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-purple-200 space-y-1">
                <div><strong>ID:</strong> <span className="font-mono">{evento.id}</span></div>
                <div><strong>Nombre:</strong> {evento.nombre || 'N/A'}</div>
                <div><strong>PIN:</strong> {evento.pin || 'N/A'}</div>
                <div><strong>Estado:</strong> {evento.activo ? 'Activo' : 'Inactivo'}</div>
                <div><strong>Participantes:</strong> {evento.cantidadParticipantes || 0}</div>
                <div><strong>Etiquetas:</strong> {evento.cantidadEtiquetas || 0}</div>
                <div><strong>Anfitrión ID:</strong> <span className="font-mono">{evento.anfitrionId || 'N/A'}</span></div>
                <div><strong>Creado:</strong> {formatearFecha(evento.creadoEn)}</div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
};

// Componente para fila de etiqueta con expand/collapse y edición
const EtiquetaRow: React.FC<{
  etiqueta: any;
  isExpanded: boolean;
  isEditing: boolean;
  onToggleExpand: () => void;
  onToggleEdit: () => void;
  onSave: (datos: any) => void;
  onDelete: () => void;
  formatearFecha: (fecha: any) => string;
}> = ({ etiqueta, isExpanded, isEditing, onToggleExpand, onToggleEdit, onSave, onDelete, formatearFecha }) => {
  const [editNombre, setEditNombre] = useState(etiqueta.etiquetaNombre || '');
  const [editOrden, setEditOrden] = useState(etiqueta.orden !== undefined ? etiqueta.orden : 0);

  useEffect(() => {
    if (isEditing) {
      setEditNombre(etiqueta.etiquetaNombre || '');
      setEditOrden(etiqueta.orden !== undefined ? etiqueta.orden : 0);
    }
  }, [isEditing, etiqueta]);

  return (
    <>
      <tr className="transition-colors" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(107, 33, 168, 0.4)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
        <td className="px-2 md:px-4 py-2 md:py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleExpand}
              className="text-purple-300 hover:text-white transition-colors text-xs"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
            <div className="text-sm font-medium text-white">{etiqueta.etiquetaNombre || 'Sin nombre'}</div>
          </div>
          <div className="text-xs text-purple-300/70 font-mono md:hidden mt-1">{etiqueta.eventoId?.substring(0, 8) || 'N/A'}...</div>
          <div className="text-xs text-purple-300/70 md:hidden mt-1">Orden: {etiqueta.orden !== undefined ? etiqueta.orden : 0}</div>
        </td>
        <td className="px-2 md:px-4 py-2 md:py-3 text-sm text-purple-100 font-mono hidden sm:table-cell">{etiqueta.eventoId?.substring(0, 8) || 'N/A'}...</td>
        <td className="px-2 md:px-4 py-2 md:py-3 text-sm">
          {etiqueta.naipeId ? (
            <span className="text-white text-xs md:text-sm font-medium">{etiqueta.naipeId}</span>
          ) : (
            <span className="text-purple-300/60 italic text-xs md:text-sm">Sin naipe</span>
          )}
        </td>
        <td className="px-2 md:px-4 py-2 md:py-3 text-sm text-purple-100 hidden md:table-cell">{etiqueta.orden !== undefined ? etiqueta.orden : 0}</td>
        <td className="px-2 md:px-4 py-2 md:py-3 text-sm">
          <div className="flex gap-2">
            <button
              onClick={onToggleEdit}
              className="text-blue-400 hover:text-blue-300 transition-colors text-xs md:text-sm font-medium"
            >
              {isEditing ? 'Cancelar' : 'Editar'}
            </button>
            <button
              onClick={onDelete}
              className="text-red-400 hover:text-red-300 transition-colors text-xs md:text-sm font-medium"
            >
              Eliminar
            </button>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={5} className="px-2 md:px-4 py-3" style={{ backgroundColor: 'rgba(107, 33, 168, 0.3)' }}>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-purple-200 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    className="w-full px-3 py-2 rounded text-sm text-white border" style={{ backgroundColor: 'rgba(88, 28, 135, 0.6)', borderColor: 'rgba(147, 51, 234, 0.5)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-purple-200 mb-1">Orden</label>
                  <input
                    type="number"
                    value={editOrden}
                    onChange={(e) => setEditOrden(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded text-sm text-white border" style={{ backgroundColor: 'rgba(88, 28, 135, 0.6)', borderColor: 'rgba(147, 51, 234, 0.5)' }}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onSave({ etiquetaNombre: editNombre, orden: editOrden })}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={onToggleEdit}
                    className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-purple-200 space-y-1">
                <div><strong>ID:</strong> <span className="font-mono">{etiqueta.id}</span></div>
                <div><strong>Nombre:</strong> {etiqueta.etiquetaNombre || 'N/A'}</div>
                <div><strong>Evento ID:</strong> <span className="font-mono">{etiqueta.eventoId || 'N/A'}</span></div>
                <div><strong>Naipe ID:</strong> {etiqueta.naipeId || 'Sin naipe'}</div>
                <div><strong>Orden:</strong> {etiqueta.orden !== undefined ? etiqueta.orden : 0}</div>
                <div><strong>Creado:</strong> {formatearFecha(etiqueta.creadoEn)}</div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
};

const AdminPage: React.FC = () => {
  const { isAuthenticated, loading: authLoading, logout } = useAdminAuth();
  const [currentTab, setCurrentTab] = useState<TabType>('anfitriones');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());

  const {
    anfitriones,
    loading: anfitrionesLoading,
    actualizarAnfitrion,
    eliminarAnfitrion,
    deshabilitarAnfitrion,
    habilitarAnfitrion
  } = useAdminAnfitriones();

  const {
    participantes,
    loading: participantesLoading,
    actualizarParticipante,
    eliminarParticipante,
    deshabilitarParticipante,
    habilitarParticipante
  } = useAdminParticipantes();

  const {
    eventos,
    loading: eventosLoading,
    actualizarEvento,
    eliminarEvento,
    deshabilitarEvento,
    habilitarEvento
  } = useAdminEventos();

  const {
    etiquetas,
    loading: etiquetasLoading,
    actualizarEtiqueta,
    eliminarEtiqueta
  } = useAdminEtiquetas();

  const formatearFecha = (fecha: any) => {
    if (!fecha) return 'N/A';
    try {
      const fechaObj = fecha?.toDate?.() || (fecha ? new Date(fecha) : null);
      if (!fechaObj) return 'N/A';
      return fechaObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
    // Cerrar edición si está abierta
    setEditingRows(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const toggleEdit = (id: string) => {
    setEditingRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
        // Expandir si está colapsado
        setExpandedRows(prevExpanded => new Set(prevExpanded).add(id));
      }
      return newSet;
    });
  };

  const handleEliminar = async (tipo: TabType, id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.')) {
      return;
    }

    let resultado;
    if (tipo === 'anfitriones') {
      resultado = await eliminarAnfitrion(id);
    } else if (tipo === 'participantes') {
      resultado = await eliminarParticipante(id);
    } else if (tipo === 'eventos') {
      resultado = await eliminarEvento(id);
    } else {
      resultado = await eliminarEtiqueta(id);
    }

    if (!resultado.success) {
      alert(resultado.error || 'Error al eliminar');
    } else {
      // Cerrar expansión y edición si estaban abiertas
      setExpandedRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      setEditingRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleDeshabilitar = async (tipo: TabType, id: string) => {
    if (!confirm('¿Estás seguro de que deseas deshabilitar este elemento?')) {
      return;
    }

    let resultado;
    if (tipo === 'anfitriones') {
      resultado = await deshabilitarAnfitrion(id);
    } else if (tipo === 'participantes') {
      resultado = await deshabilitarParticipante(id);
    } else if (tipo === 'eventos') {
      resultado = await deshabilitarEvento(id);
    } else {
      return; // Etiquetas no tienen deshabilitar
    }

    if (!resultado.success) {
      alert(resultado.error || 'Error al deshabilitar');
    }
  };

  const handleHabilitar = async (tipo: TabType, id: string) => {
    let resultado;
    if (tipo === 'anfitriones') {
      resultado = await habilitarAnfitrion(id);
    } else if (tipo === 'participantes') {
      resultado = await habilitarParticipante(id);
    } else if (tipo === 'eventos') {
      resultado = await habilitarEvento(id);
    } else {
      return; // Etiquetas no tienen habilitar
    }

    if (!resultado.success) {
      alert(resultado.error || 'Error al habilitar');
    }
  };

  const handleGuardarEdicion = async (tipo: TabType, id: string, datos: any) => {
    let resultado;
    if (tipo === 'anfitriones') {
      resultado = await actualizarAnfitrion(id, datos);
    } else if (tipo === 'participantes') {
      resultado = await actualizarParticipante(id, datos);
    } else if (tipo === 'eventos') {
      resultado = await actualizarEvento(id, datos);
    } else {
      resultado = await actualizarEtiqueta(id, datos);
    }

    if (resultado.success) {
      setEditingRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } else {
      alert(resultado.error || 'Error al actualizar');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#3b0764' }}>
        <div className="text-purple-200">Verificando autenticación...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={() => window.location.reload()} />;
  }

  const tabs = [
    { id: 'anfitriones' as TabType, label: 'Anfitriones' },
    { id: 'participantes' as TabType, label: 'Participantes' },
    { id: 'eventos' as TabType, label: 'Eventos' },
    { id: 'etiquetas' as TabType, label: 'Etiquetas' }
  ];

  // Filtrar datos según búsqueda
  const anfitrionesFiltrados = anfitriones.filter(a =>
    (a.alias || a.nombreAnfitrion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.nombreCompleto || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const participantesFiltrados = participantes.filter(p =>
    (p.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.eventoId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const eventosFiltrados = eventos.filter(e =>
    (e.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.pin || '').includes(searchTerm)
  );

  const etiquetasFiltradas = etiquetas.filter(e =>
    (e.etiquetaNombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.etiquetaId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen p-2 md:p-4" style={{ backgroundColor: '#3b0764' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="border shadow-xl mb-4 md:mb-6 rounded-xl p-3 md:p-4 backdrop-blur-sm" style={{ backgroundColor: 'rgba(88, 28, 135, 0.8)', borderColor: 'rgba(107, 33, 168, 0.5)' }}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-0">
            <div className="flex items-center justify-center md:justify-start w-full md:w-auto">
              <img src="/images/logo-pinot.png" alt="Pinot Logo" className="w-full max-w-[560px]" />
            </div>
            <div className="flex flex-wrap justify-center gap-2 w-full md:w-auto">
              <a
                href="/admin/changelog"
                className="px-3 py-2 text-sm text-white font-semibold rounded-lg transition-colors border shadow-md hover:opacity-90" style={{ backgroundColor: 'rgba(107, 33, 168, 0.6)', borderColor: 'rgba(147, 51, 234, 0.5)' }}
              >
                📋 Changelog
              </a>
              <button
                onClick={() => setShowChangePassword(true)}
                className="px-3 py-2 text-sm text-white font-semibold rounded-lg transition-colors border shadow-md hover:opacity-90" style={{ backgroundColor: 'rgba(107, 33, 168, 0.6)', borderColor: 'rgba(147, 51, 234, 0.5)' }}
              >
                Cambiar Contraseña
              </button>
              <button
                onClick={logout}
                className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </header>

        {/* Layout: Tabs verticales en móvil, horizontales en desktop */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Tabs - Vertical en móvil, horizontal en desktop */}
          <div className="border rounded-xl shadow-xl md:min-w-[200px] backdrop-blur-sm" style={{ backgroundColor: 'rgba(88, 28, 135, 0.8)', borderColor: 'rgba(107, 33, 168, 0.5)' }}>
            <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setCurrentTab(tab.id);
                    setSearchTerm('');
                  }}
                  className={`px-4 md:px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 md:border-b-0 md:border-l-2 ${
                    currentTab === tab.id
                      ? 'text-white shadow-md' 
                      : 'hover:text-white'
                  }`}
                  style={currentTab === tab.id 
                    ? { borderColor: '#c084fc', backgroundColor: 'rgba(107, 33, 168, 0.6)' }
                    : { borderColor: 'rgba(107, 33, 168, 0.3)', color: '#e9d5ff' }
                  }
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Contenido principal */}
          <div className="flex-1 flex flex-col gap-4 md:gap-6">

            {/* Búsqueda */}
            <div className="border rounded-xl shadow-xl p-3 md:p-4 backdrop-blur-sm" style={{ backgroundColor: 'rgba(88, 28, 135, 0.8)', borderColor: 'rgba(107, 33, 168, 0.5)' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Buscar en ${tabs.find(t => t.id === currentTab)?.label.toLowerCase()}...`}
                className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base rounded-lg text-white focus:outline-none focus:ring-2 transition-all" style={{ backgroundColor: 'rgba(107, 33, 168, 0.6)', borderColor: 'rgba(126, 34, 206, 0.5)', placeholderColor: 'rgba(216, 180, 254, 0.6)' }}
              />
            </div>

            {/* Contenido de Tabs */}
            <div className="border rounded-xl shadow-xl p-4 md:p-6 backdrop-blur-sm" style={{ backgroundColor: 'rgba(88, 28, 135, 0.8)', borderColor: 'rgba(107, 33, 168, 0.5)' }}>
              {/* Tab: Anfitriones */}
              {currentTab === 'anfitriones' && (
                <div>
              <h2 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4 font-branding">Anfitriones ({anfitrionesFiltrados.length})</h2>
              {anfitrionesLoading ? (
                <div className="text-center py-8">
                  <div className="spinner mx-auto"></div>
                  <p className="text-purple-200 mt-2 text-sm">Cargando anfitriones...</p>
                </div>
              ) : anfitrionesFiltrados.length === 0 ? (
                <p className="text-center py-8 text-purple-200 text-sm">No se encontraron anfitriones</p>
              ) : (
                <div className="overflow-x-auto -mx-4 md:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden">
                      <table className="min-w-full divide-y divide-purple-800/50">
                        <thead style={{ backgroundColor: 'rgba(107, 33, 168, 0.6)' }}>
                          <tr>
                            <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-purple-100 uppercase tracking-wider">Alias</th>
                            <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-purple-100 uppercase tracking-wider hidden md:table-cell">Email</th>
                            <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-purple-100 uppercase tracking-wider">Tipo</th>
                            <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-purple-100 uppercase tracking-wider hidden sm:table-cell">Verificado</th>
                            <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-purple-100 uppercase tracking-wider hidden lg:table-cell">Eventos</th>
                            <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-purple-100 uppercase tracking-wider">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y" style={{ backgroundColor: 'rgba(88, 28, 135, 0.4)' }}>
                          {anfitrionesFiltrados.map((anfitrion) => {
                            const isExpanded = expandedRows.has(anfitrion.id);
                            const isEditing = editingRows.has(anfitrion.id);
                            
                            return (
                              <AnfitrionRow
                                key={anfitrion.id}
                                anfitrion={anfitrion}
                                isExpanded={isExpanded}
                                isEditing={isEditing}
                                onToggleExpand={() => toggleExpand(anfitrion.id)}
                                onToggleEdit={() => toggleEdit(anfitrion.id)}
                                onSave={(datos) => handleGuardarEdicion('anfitriones', anfitrion.id, datos)}
                                onDelete={() => handleEliminar('anfitriones', anfitrion.id)}
                                formatearFecha={formatearFecha}
                              />
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
                </div>
              )}

              {/* Tab: Participantes */}
              {currentTab === 'participantes' && (
                <div>
              <h2 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4 font-branding">Participantes ({participantesFiltrados.length})</h2>
              {participantesLoading ? (
                <div className="text-center py-8">
                  <div className="spinner mx-auto mb-2"></div>
                  <p className="text-purple-200 text-sm">Cargando participantes...</p>
                </div>
              ) : participantesFiltrados.length === 0 ? (
                <p className="text-center py-8 text-purple-200 text-sm">No se encontraron participantes</p>
              ) : (
                <div className="overflow-x-auto -mx-4 md:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden">
                      <table className="min-w-full divide-y divide-purple-800/50">
                        <thead style={{ backgroundColor: 'rgba(107, 33, 168, 0.6)' }}>
                          <tr>
                            <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-purple-100 uppercase tracking-wider">Nombre</th>
                            <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-purple-100 uppercase tracking-wider hidden sm:table-cell">Evento ID</th>
                            <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-purple-100 uppercase tracking-wider hidden md:table-cell">Creado</th>
                            <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-purple-100 uppercase tracking-wider">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y" style={{ backgroundColor: 'rgba(88, 28, 135, 0.4)' }}>
                          {participantesFiltrados.map((participante) => {
                            const isExpanded = expandedRows.has(participante.id);
                            const isEditing = editingRows.has(participante.id);
                            
                            return (
                              <ParticipanteRow
                                key={participante.id}
                                participante={participante}
                                isExpanded={isExpanded}
                                isEditing={isEditing}
                                onToggleExpand={() => toggleExpand(participante.id)}
                                onToggleEdit={() => toggleEdit(participante.id)}
                                onSave={(datos) => handleGuardarEdicion('participantes', participante.id, datos)}
                                onDelete={() => handleEliminar('participantes', participante.id)}
                                onDeshabilitar={() => handleDeshabilitar('participantes', participante.id)}
                                onHabilitar={() => handleHabilitar('participantes', participante.id)}
                                formatearFecha={formatearFecha}
                              />
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              </div>
            )}

            {/* Tab: Eventos */}
          {currentTab === 'eventos' && (
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4 font-branding">Eventos ({eventosFiltrados.length})</h2>
              {eventosLoading ? (
                <div className="text-center py-8">
                  <div className="spinner mx-auto mb-2"></div>
                  <p className="text-purple-200 text-sm">Cargando eventos...</p>
                </div>
              ) : eventosFiltrados.length === 0 ? (
                <p className="text-center py-8 text-purple-200 text-sm">No se encontraron eventos</p>
              ) : (
                <div className="overflow-x-auto -mx-4 md:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden">
                      <table className="min-w-full divide-y divide-purple-800/50">
                        <thead style={{ backgroundColor: 'rgba(107, 33, 168, 0.6)' }}>
                          <tr>
                            <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-purple-100 uppercase tracking-wider">Nombre</th>
                            <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-purple-100 uppercase tracking-wider">PIN</th>
                            <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-purple-100 uppercase tracking-wider">Estado</th>
                            <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-purple-100 uppercase tracking-wider hidden sm:table-cell">Participantes</th>
                            <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-purple-100 uppercase tracking-wider hidden md:table-cell">Etiquetas</th>
                            <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-purple-100 uppercase tracking-wider">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y" style={{ backgroundColor: 'rgba(88, 28, 135, 0.4)' }}>
                          {eventosFiltrados.map((evento) => {
                            const isExpanded = expandedRows.has(evento.id);
                            const isEditing = editingRows.has(evento.id);
                            
                            return (
                              <EventoRow
                                key={evento.id}
                                evento={evento}
                                isExpanded={isExpanded}
                                isEditing={isEditing}
                                onToggleExpand={() => toggleExpand(evento.id)}
                                onToggleEdit={() => toggleEdit(evento.id)}
                                onSave={(datos) => handleGuardarEdicion('eventos', evento.id, datos)}
                                onDelete={() => handleEliminar('eventos', evento.id)}
                                onDeshabilitar={() => handleDeshabilitar('eventos', evento.id)}
                                onHabilitar={() => handleHabilitar('eventos', evento.id)}
                                formatearFecha={formatearFecha}
                              />
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
                </div>
              )}

              {/* Tab: Etiquetas */}
              {currentTab === 'etiquetas' && (
                <div>
              <h2 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4 font-branding">Etiquetas ({etiquetasFiltradas.length})</h2>
              {etiquetasLoading ? (
                <div className="text-center py-8">
                  <div className="spinner mx-auto mb-2"></div>
                  <p className="text-purple-200 text-sm">Cargando etiquetas...</p>
                </div>
              ) : etiquetasFiltradas.length === 0 ? (
                <p className="text-center py-8 text-purple-200 text-sm">No se encontraron etiquetas</p>
              ) : (
                <div className="overflow-x-auto -mx-4 md:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden">
                      <table className="min-w-full divide-y divide-purple-800/50">
                        <thead style={{ backgroundColor: 'rgba(107, 33, 168, 0.6)' }}>
                          <tr>
                            <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-purple-100 uppercase tracking-wider">Nombre</th>
                            <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-purple-100 uppercase tracking-wider hidden sm:table-cell">Evento ID</th>
                            <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-purple-100 uppercase tracking-wider">Naipe</th>
                            <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-purple-100 uppercase tracking-wider hidden md:table-cell">Orden</th>
                            <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-purple-100 uppercase tracking-wider">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y" style={{ backgroundColor: 'rgba(88, 28, 135, 0.4)' }}>
                          {etiquetasFiltradas.map((etiqueta) => {
                            const isExpanded = expandedRows.has(etiqueta.id);
                            const isEditing = editingRows.has(etiqueta.id);
                            
                            return (
                              <EtiquetaRow
                                key={etiqueta.id}
                                etiqueta={etiqueta}
                                isExpanded={isExpanded}
                                isEditing={isEditing}
                                onToggleExpand={() => toggleExpand(etiqueta.id)}
                                onToggleEdit={() => toggleEdit(etiqueta.id)}
                                onSave={(datos) => handleGuardarEdicion('etiquetas', etiqueta.id, datos)}
                                onDelete={() => handleEliminar('etiquetas', etiqueta.id)}
                                formatearFecha={formatearFecha}
                              />
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal de Cambio de Contraseña */}
        <ChangePasswordModal
          isOpen={showChangePassword}
          onClose={() => setShowChangePassword(false)}
        />
      </div>
    </div>
  );
};

export default AdminPage;












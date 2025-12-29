/**
 * Página de Changelog del Sistema
 * Migración desde adminpanel/admin-logs.html
 * Muestra la trazabilidad de cambios en el sistema
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { useAdminLogs, formatearTimestamp, type AdminLog } from '../../hooks/useAdminLogs';
import AdminLogin from '../../components/admin/AdminLogin';

const AdminChangelogPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAdminAuth();
  const [activeActionsState, setActiveActionsState] = useState({
    create: true,
    update: true,
    delete: true,
    read: true
  });
  const [activeCollection, setActiveCollection] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [logLimit, setLogLimit] = useState(100);
  const [searchInput, setSearchInput] = useState('');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  // Convertir objeto de acciones a Set para el hook (memoizado)
  const activeActions = useMemo(() => {
    return new Set(
      Object.entries(activeActionsState)
        .filter(([_, active]) => active)
        .map(([action, _]) => action)
    );
  }, [activeActionsState]);

  const { logs, loading, error, cargarLogs } = useAdminLogs({
    activeActions,
    activeCollection,
    searchTerm,
    logLimit
  });

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      cargarLogs();
    }, 30000);

    return () => clearInterval(interval);
  }, [cargarLogs]);

  // Debounce para búsqueda
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchTerm(searchInput.toLowerCase());
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  const toggleAction = (action: string) => {
    setActiveActionsState(prev => ({
      ...prev,
      [action]: !prev[action as keyof typeof prev]
    }));
  };

  const toggleLogExpansion = (logId: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const renderLogEntry = (log: AdminLog) => {
    const actionLabels: Record<string, { text: string; color: string; bgColor: string }> = {
      create: { text: 'Creación', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.2)' },
      update: { text: 'Edición', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.2)' },
      delete: { text: 'Eliminación', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.2)' },
      read: { text: 'Lectura', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.2)' }
    };

    const actionLabel = actionLabels[log.accion] || actionLabels.read;
    const timestamp = formatearTimestamp(log.timestamp);
    const isExpanded = expandedLogs.has(log.id);
    const titulo = log.titulo || log.descripcion || `${log.accion.toUpperCase()} en ${log.coleccion}`;
    const dataStr = log.datos ? JSON.stringify(log.datos, null, 2) : '';
    const datosAnterioresStr = log.datosAnteriores ? JSON.stringify(log.datosAnteriores, null, 2) : '';
    const tieneDetalles = dataStr || datosAnterioresStr || log.usuario || log.coleccion || log.documentoId;

    return (
      <div
        key={log.id}
        className={`border-l-4 mb-2 transition-all duration-200 ${
          log.accion === 'create' ? 'border-green-500' :
          log.accion === 'update' ? 'border-blue-500' :
          log.accion === 'delete' ? 'border-red-500' :
          'border-gray-500'
        } ${isExpanded ? 'bg-purple-800/30' : ''}`}
        style={{ paddingLeft: '0.75rem' }}
      >
        {/* Línea principal compacta */}
        <div 
          className="flex items-center gap-3 py-2 cursor-pointer hover:bg-purple-800/20 rounded transition-colors"
          onClick={() => tieneDetalles && toggleLogExpansion(log.id)}
        >
          {/* Timestamp */}
          <span className="text-gray-400 text-xs font-mono min-w-[140px]">
            {timestamp}
          </span>
          
          {/* Título del evento */}
          <span className="flex-1 text-white text-sm font-medium">
            {titulo}
          </span>
          
          {/* Label de acción */}
          <span
            className="px-2 py-1 rounded text-xs font-semibold min-w-[80px] text-center"
            style={{
              color: actionLabel.color,
              backgroundColor: actionLabel.bgColor,
              border: `1px solid ${actionLabel.color}`
            }}
          >
            {actionLabel.text}
          </span>
          
          {/* Indicador de expand/collapse */}
          {tieneDetalles && (
            <span className="text-gray-400 text-xs">
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
        </div>

        {/* Detalles expandidos */}
        {isExpanded && tieneDetalles && (
          <div className="pl-4 pb-2 space-y-2 border-t border-purple-700/30 pt-2 mt-1">
            {/* Información adicional */}
            <div className="flex flex-wrap gap-4 text-xs">
              {log.coleccion && (
                <div>
                  <span className="text-gray-400">Colección:</span>
                  <span className="text-yellow-400 ml-1 font-semibold">{log.coleccion}</span>
                </div>
              )}
              {log.documentoId && (
                <div>
                  <span className="text-gray-400">ID:</span>
                  <span className="text-purple-400 ml-1 font-mono">{log.documentoId}</span>
                </div>
              )}
              {log.usuario && (
                <div>
                  <span className="text-gray-400">Usuario:</span>
                  <span className="text-green-400 ml-1">{log.usuario}</span>
                </div>
              )}
            </div>

            {/* Datos anteriores */}
            {datosAnterioresStr && (
              <details className="mt-2">
                <summary className="text-red-400 text-xs cursor-pointer hover:text-red-300 font-semibold">
                  📋 Ver datos anteriores
                </summary>
                <pre className="text-red-300 text-xs mt-1 bg-gray-900/50 p-3 rounded overflow-auto max-h-60 border border-red-500/30">
                  {datosAnterioresStr}
                </pre>
              </details>
            )}

            {/* Datos nuevos */}
            {dataStr && (
              <details className="mt-2">
                <summary className="text-blue-400 text-xs cursor-pointer hover:text-blue-300 font-semibold">
                  📋 Ver datos nuevos
                </summary>
                <pre className="text-blue-300 text-xs mt-1 bg-gray-900/50 p-3 rounded overflow-auto max-h-60 border border-blue-500/30">
                  {dataStr}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#3b0764' }}>
        <div style={{ color: '#e9d5ff' }}>Verificando autenticación...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen p-2 md:p-4 font-mono" style={{ backgroundColor: '#3b0764' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-purple-900/80 border border-purple-800/50 shadow-xl mb-4 md:mb-6 rounded-xl p-3 md:p-4 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-0">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <img 
                  src="/images/logo-pinot.png" 
                  alt="Pinot Logo" 
                  className="w-full max-w-[560px]"
                  style={{ height: 'clamp(5rem, 7.5vw, 8.125rem)' }}
                />
                <h1 className="text-white/90 text-lg font-medium font-branding">Changelog</h1>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/admin')}
                className="px-4 py-2 bg-purple-800/60 text-white rounded-lg hover:bg-purple-700/80 transition-colors border border-purple-600/50"
              >
                Volver
              </button>
              <button
                onClick={() => cargarLogs()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors border border-purple-500/50"
              >
                🔄 Actualizar
              </button>
            </div>
          </div>
        </header>

        {/* Filtros */}
        <div className="bg-purple-900/80 border border-purple-800/50 rounded-xl shadow-sm p-4 mb-6 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="text-gray-400 text-sm mr-2">Filtrar por acción:</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {['create', 'update', 'delete', 'read'].map((action) => {
                  const isActive = activeActionsState[action as keyof typeof activeActionsState];
                  const colors: Record<string, string> = {
                    create: 'bg-green-600',
                    update: 'bg-blue-600',
                    delete: 'bg-red-600',
                    read: 'bg-gray-600'
                  };
                  return (
                    <button
                      key={action}
                      onClick={() => toggleAction(action)}
                      className={`px-2 py-1 rounded text-xs text-white transition-opacity ${
                        colors[action]
                      } ${isActive ? 'opacity-100' : 'opacity-50'}`}
                    >
                      {action.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-sm mr-2">Filtrar por colección:</label>
              <select
                value={activeCollection}
                onChange={(e) => setActiveCollection(e.target.value)}
                className="bg-purple-800/60 text-white px-3 py-1 rounded border border-purple-600/50 mt-1"
              >
                <option value="">Todas</option>
                <option value="anfitriones">Anfitriones</option>
                <option value="eventos">Eventos</option>
                <option value="participantes">Participantes</option>
                <option value="etiquetas">Etiquetas</option>
                <option value="selecciones">Selecciones</option>
                <option value="usuarios">Usuarios</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-sm mr-2">Buscar:</label>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar en changelog..."
                className="bg-purple-800/60 text-white px-3 py-1 rounded border border-purple-600/50 w-64 mt-1"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mr-2">Límite:</label>
              <select
                value={logLimit}
                onChange={(e) => setLogLimit(Number(e.target.value))}
                className="bg-purple-800/60 text-white px-3 py-1 rounded border border-purple-600/50 mt-1"
              >
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
                <option value="500">500</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contenedor de changelog */}
        <div className="bg-purple-900/80 border border-purple-800/50 rounded-xl shadow-sm p-4 backdrop-blur-sm">
          {loading ? (
            <div className="text-center py-8 text-gray-400">
              <div className="spinner border-purple-600/30 border-t-purple-500 w-10 h-10 mx-auto mb-2"></div>
              <p>Cargando changelog...</p>
            </div>
          ) : error ? (
            <div className="text-red-400 text-center py-8">
              Error al cargar changelog: {error}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No se encontraron entradas en el changelog
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map(log => renderLogEntry(log))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChangelogPage;







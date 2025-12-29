/**
 * WineCards Component
 * Componente para mostrar cards de vinos/eventos
 */

import React from 'react';
import { Link } from 'react-router-dom';

export interface WineCardEvent {
  id: string;
  nombre: string;
  tipo?: string;
  descripcion?: string;
  rating?: number;
  precio?: string;
  imagenUrl?: string;
  fecha?: string;
  activo?: boolean;
}

interface WineCardsProps {
  events: WineCardEvent[];
  emptyMessage?: string;
}

const WineCards: React.FC<WineCardsProps> = ({ events, emptyMessage = 'No se encontraron eventos activos' }) => {
  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-purple-600">
        <p className="text-base font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {events.map((event) => {
        const rating = event.rating || 4.5;
        const price = event.precio || 'Gratis';
        const imageUrl = event.imagenUrl || 'https://images.unsplash.com/photo-1677499829131-e1e47bf23cd8?w=400';
        
        return (
          <div
            key={event.id}
            className="pinot-wine-card overflow-hidden rounded-2xl bg-white/95 backdrop-blur-sm shadow-sm border transition-all active:scale-[0.98]"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100">
              <img
                src={imageUrl}
                alt={event.nombre || 'Evento'}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1677499829131-e1e47bf23cd8?w=400';
                }}
              />
              <Link
                to="/favs"
                className="absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-lg transition-transform active:scale-90"
                aria-label="Ver favoritos"
              >
                <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </Link>
            </div>
            
            <div className="p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{event.nombre || 'Evento sin nombre'}</h3>
                  {event.tipo && (
                    <p className="text-sm text-gray-600 mt-1">{event.tipo}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-yellow-500">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-medium">{rating.toFixed(1)}</span>
                </div>
              </div>
              
              {event.descripcion && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{event.descripcion}</p>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-purple-600">{price}</span>
                <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm font-medium hover:shadow-md transition-shadow active:scale-95">
                  Ver más
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WineCards;


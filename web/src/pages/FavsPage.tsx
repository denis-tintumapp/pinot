/**
 * Favs Page
 * Página de favoritos
 * Migrado desde favs.html y favs.js
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import BottomNavigation from '../components/hero/BottomNavigation';
import WineCards, { WineCardEvent } from '../components/explore/WineCards';

const BottomSheet = lazy(() => import('../components/ui/BottomSheet'));

const FavsPage: React.FC = () => {
  const [favorites, setFavorites] = useState<WineCardEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      // TODO: Conectar con backend/Firestore cuando esté listo
      // Por ahora, usar datos de ejemplo para visualización
      const exampleFavorites: WineCardEvent[] = [
        {
          id: 'chateau-margaux-1',
          nombre: 'Château Margaux',
          tipo: 'Tinto',
          descripcion: 'Burdeos, Francia',
          rating: 4.8,
          precio: '€89',
          imagenUrl: '/images/wine-chateau-margaux.jpg'
        },
        {
          id: 'catena-zapata-1',
          nombre: 'Catena Zapata Malbec',
          tipo: 'Tinto',
          descripcion: 'Mendoza, Argentina',
          rating: 4.7,
          precio: '$45',
          imagenUrl: '/images/wine-catena-zapata.jpg'
        },
        {
          id: 'concha-toro-1',
          nombre: 'Viña Concha y Toro Carmenere',
          tipo: 'Tinto',
          descripcion: 'Valle Central, Chile',
          rating: 4.5,
          precio: '$32',
          imagenUrl: '/images/wine-concha-toro.jpg'
        },
        {
          id: 'trapiche-1',
          nombre: 'Trapiche Gran Medalla',
          tipo: 'Tinto',
          descripcion: 'Mendoza, Argentina',
          rating: 4.6,
          precio: '$38',
          imagenUrl: '/images/wine-trapiche.jpg'
        }
      ];
      
      setFavorites(exampleFavorites);
    } catch (error) {
      console.error('Error al cargar favoritos:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterClick = () => {
    console.log('Filtro de favoritos (funcionalidad por implementar)');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header - Solo logo y menú hamburguesa */}
      <header className="flex items-center justify-between px-4 py-4 relative z-[10] border-b border-gray-200/50 backdrop-blur-sm bg-white/90">
        {/* Logo */}
        <img src="/images/logo-pinot.png" alt="Pinot" className="h-12 w-auto" />
        {/* Menú hamburguesa - BottomSheet maneja el click internamente */}
        <button 
          id="menuToggle"
          className="p-3 text-gray-700 hover:text-gray-900 transition-colors"
          aria-label="Menú"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 relative z-[10] px-4 py-6 pb-24 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Header de Favoritos */}
          <section className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-purple-600">Mis Favoritos</h1>
              <p className="text-sm text-gray-600">{favorites.length} vinos guardados</p>
            </div>
            <button
              onClick={handleFilterClick}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 transition-all active:scale-95"
              aria-label="Filtrar favoritos"
            >
              <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>
          </section>
          {/* Lista de Favoritos */}
          {loading ? (
            <div className="text-center py-12 text-purple-600">
              <p className="text-base font-medium">Cargando favoritos...</p>
            </div>
          ) : favorites.length === 0 ? (
            <section className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
                <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">No hay favoritos aún</h3>
              <p className="mb-6 max-w-sm text-sm text-gray-600">
                Guarda tus vinos favoritos para encontrarlos fácilmente más tarde
              </p>
              <a href="/explore" className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 font-medium text-white shadow-lg transition-transform active:scale-95">
                Explorar vinos
              </a>
            </section>
          ) : (
            <section className="grid gap-4">
              <WineCards events={favorites} emptyMessage="No se encontraron favoritos" />
            </section>
          )}
        </div>
      </main>

      {/* Navegación inferior */}
      <BottomNavigation />

      {/* Bottom Sheet */}
      <Suspense fallback={null}>
        <BottomSheet />
      </Suspense>
    </div>
  );
};

export default FavsPage;


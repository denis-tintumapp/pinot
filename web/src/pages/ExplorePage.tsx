/**
 * Explore Page
 * Página para explorar eventos y vinos
 * Migrado desde explore.html y explore.js
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import BottomNavigation from '../components/hero/BottomNavigation';
import CategoriesGrid, { Category } from '../components/explore/CategoriesGrid';

const BottomSheet = lazy(() => import('../components/ui/BottomSheet'));
import TrendingTags, { TrendingTag } from '../components/explore/TrendingTags';
import RegionsGrid, { Region } from '../components/explore/RegionsGrid';
import SearchBar from '../components/explore/SearchBar';
import WineCards, { WineCardEvent } from '../components/explore/WineCards';
import { listarEventos } from '../../js/firestore.js';

const ExplorePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedTag, setSelectedTag] = useState<TrendingTag | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<WineCardEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<WineCardEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar eventos iniciales
  useEffect(() => {
    loadEvents();
  }, []);

  // Aplicar filtros cuando cambian los estados
  useEffect(() => {
    applyFilters();
  }, [events, selectedCategory, selectedRegion, selectedTag, searchQuery]);

  // Cargar eventos desde Firestore
  const loadEvents = async () => {
    try {
      setLoading(true);
      // Obtener todos los eventos (usando importación estática que funciona con Vite)
      const resultado = await listarEventos();
      
      if (!resultado.ok) {
        throw new Error(resultado.error || 'Error al cargar eventos');
      }
      
      const eventosList = resultado.data || [];
      
      // Mapear eventos a formato para cards
      const mappedEvents: WineCardEvent[] = eventosList.map((evento: any) => ({
        id: evento.id,
        nombre: evento.nombre || 'Evento sin nombre',
        tipo: 'Cata a ciegas',
        descripcion: evento.descripcion || 'Evento de cata de vinos',
        rating: 4.5,
        precio: 'Gratis',
        imagenUrl: evento.imagenUrl || null,
        fecha: evento.fecha || null,
        activo: evento.activo || false
      }));
      
      setEvents(mappedEvents);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros combinados
  const applyFilters = () => {
    let filtered = [...events];
    const query = searchQuery.toLowerCase();
    
    // Filtrar por búsqueda
    if (query) {
      filtered = filtered.filter(event => 
        event.nombre.toLowerCase().includes(query) ||
        (event.descripcion && event.descripcion.toLowerCase().includes(query)) ||
        (event.tipo && event.tipo.toLowerCase().includes(query))
      );
    }
    
    // Filtrar por categoría
    if (selectedCategory) {
      switch (selectedCategory.id) {
        case 'vinos':
          // Todos los eventos son "vinos" por defecto
          break;
        case 'regiones':
          // Si hay región seleccionada, filtrar por ella (implementar cuando haya datos de región)
          break;
        case 'experiencias':
          // Filtrar eventos activos o próximos
          filtered = filtered.filter(event => event.activo || (event.fecha && new Date(event.fecha) >= new Date()));
          break;
        case 'ofertas':
          // Filtrar eventos con precio especial
          filtered = filtered.filter(event => event.precio && event.precio !== 'Gratis');
          break;
      }
    }
    
    // Filtrar por región (independiente de categoría)
    // Por ahora no hay datos de región en eventos
    
    // Filtrar por tag de tendencia
    if (selectedTag) {
      switch (selectedTag.id) {
        case 'nuevos':
          // Ordenar por fecha de creación (más recientes primero)
          filtered = filtered.sort((a, b) => {
            const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0;
            const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0;
            return fechaB - fechaA;
          });
          break;
        case 'mejor-valorados':
          // Ordenar por rating (mayor primero)
          filtered = filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case 'ofertas':
          // Filtrar eventos con precio especial
          filtered = filtered.filter(event => event.precio && event.precio !== 'Gratis');
          break;
        case 'sostenibles':
        case 'organicos':
          // Por ahora, no filtrar ya que no tenemos estos campos
          break;
      }
    }
    
    setFilteredEvents(filtered);
  };

  const handleCategoryClick = (category: Category | null) => {
    setSelectedCategory(category);
  };

  const handleTagClick = (tag: TrendingTag | null) => {
    setSelectedTag(tag);
  };

  const handleRegionClick = (region: Region | null) => {
    setSelectedRegion(region);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterClick = () => {
    console.log('Abrir filtros');
    // TODO: Implementar modal de filtros
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
          
          {/* Header de Explorar */}
          <section className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-purple-600">Explorar</h1>
              {filteredEvents.length > 0 && (
                <p className="text-sm text-gray-600">{filteredEvents.length} {filteredEvents.length === 1 ? 'evento' : 'eventos'}</p>
              )}
            </div>
          </section>

        {/* Barra de búsqueda */}
        <div className="mb-2">
          <SearchBar onSearch={handleSearch} onFilterClick={handleFilterClick} />
        </div>

        {/* Categorías con mejor presentación */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Categorías</h2>
            {selectedCategory && (
              <button
                onClick={() => handleCategoryClick(null)}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Limpiar
              </button>
            )}
          </div>
          <CategoriesGrid
            selectedCategory={selectedCategory}
            onCategoryClick={handleCategoryClick}
            preselectFirst={true}
          />
        </section>

        {/* Tags de tendencias con mejor presentación */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Tendencias</h2>
            {selectedTag && (
              <button
                onClick={() => handleTagClick(null)}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Limpiar
              </button>
            )}
          </div>
          <TrendingTags
            selectedTag={selectedTag}
            onTagClick={handleTagClick}
            preselectFirst={true}
          />
        </section>

        {/* Regiones */}
        {selectedCategory?.id === 'regiones' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Regiones</h2>
              {selectedRegion && (
                <button
                  onClick={() => handleRegionClick(null)}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Limpiar
                </button>
              )}
            </div>
            <RegionsGrid
              selectedRegion={selectedRegion}
              onRegionClick={handleRegionClick}
            />
          </section>
        )}

        {/* Lista de eventos con mejor presentación */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {selectedCategory || selectedTag || searchQuery
                ? 'Resultados'
                : 'Eventos destacados'}
            </h2>
          </div>
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
              <p className="text-base font-medium text-gray-600">Cargando eventos...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-16 bg-white/50 rounded-2xl border border-gray-200/50">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron eventos</h3>
              <p className="text-sm text-gray-600 mb-4">Intenta ajustar los filtros o la búsqueda</p>
              {(selectedCategory || selectedTag || searchQuery) && (
                <button
                  onClick={() => {
                    handleCategoryClick(null);
                    handleTagClick(null);
                    handleSearch('');
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <WineCards events={filteredEvents} emptyMessage="No se encontraron eventos activos" />
          )}
        </section>
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

export default ExplorePage;


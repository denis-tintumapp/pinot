/**
 * RegionsGrid Component
 * Grid de regiones vitivinícolas
 */

import React from 'react';

export interface Region {
  id: string;
  name: string;
  country: string;
  flag: string;
}

export const regions: Region[] = [
  { id: 'mendoza', name: 'Mendoza', country: 'Argentina', flag: '🇦🇷' },
  { id: 'valle-central', name: 'Valle Central', country: 'Chile', flag: '🇨🇱' },
  { id: 'toscana', name: 'Toscana', country: 'Italia', flag: '🇮🇹' },
  { id: 'bordeaux', name: 'Burdeos', country: 'Francia', flag: '🇫🇷' },
  { id: 'napa', name: 'Napa Valley', country: 'EE.UU.', flag: '🇺🇸' },
  { id: 'rioja', name: 'Rioja', country: 'España', flag: '🇪🇸' }
];

interface RegionsGridProps {
  selectedRegion: Region | null;
  onRegionClick: (region: Region | null) => void;
}

const RegionsGrid: React.FC<RegionsGridProps> = ({ selectedRegion, onRegionClick }) => {
  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {regions.map((region) => {
        const isSelected = selectedRegion?.id === region.id;
        
        return (
          <button
            key={region.id}
            onClick={() => onRegionClick(isSelected ? null : region)}
            className={`relative overflow-hidden rounded-xl p-4 text-center transition-all duration-200 active:scale-95 ${
              isSelected
                ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg scale-105'
                : 'bg-white/90 backdrop-blur-sm border border-gray-200/50 hover:shadow-md'
            }`}
          >
            <div className={`text-3xl mb-2 ${isSelected ? 'filter brightness-0 invert' : ''}`}>
              {region.flag}
            </div>
            <h4 className={`text-sm font-semibold mb-1 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
              {region.name}
            </h4>
            <p className={`text-xs ${isSelected ? 'text-white/90' : 'text-gray-600'}`}>
              {region.country}
            </p>
          </button>
        );
      })}
    </div>
  );
};

export default RegionsGrid;


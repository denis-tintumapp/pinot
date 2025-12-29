/**
 * CategoriesGrid Component
 * Grid de categorías de vinos para la página de exploración
 */

import React from 'react';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: string;
  description: string;
}

export const categories: Category[] = [
  {
    id: 'vinos',
    name: 'Vinos',
    icon: 'wine',
    color: 'from-purple-500 to-purple-600',
    count: '500+',
    description: 'Tintos, blancos y rosados'
  },
  {
    id: 'regiones',
    name: 'Regiones',
    icon: 'map-pin',
    color: 'from-pink-500 to-pink-600',
    count: '25+',
    description: 'Explora el mundo del vino'
  },
  {
    id: 'experiencias',
    name: 'Experiencias',
    icon: 'calendar',
    color: 'from-purple-600 to-pink-500',
    count: '12',
    description: 'Catas y eventos'
  },
  {
    id: 'ofertas',
    name: 'Ofertas',
    icon: 'tag',
    color: 'from-orange-500 to-red-500',
    count: '18',
    description: 'Descuentos especiales'
  }
];

interface CategoriesGridProps {
  selectedCategory: Category | null;
  onCategoryClick: (category: Category | null) => void;
  preselectFirst?: boolean;
}

const getIconSVG = (iconType: string) => {
  const icons: Record<string, string> = {
    'wine': `<path d="M8 22h8"></path><path d="M12 10v12"></path><path d="M5 2h14"></path><path d="M5 2 C5 4.5, 5.5 7, 7.5 8.5 C9.5 10, 12 10, 12 10 C12 10, 14.5 10, 16.5 8.5 C18.5 7, 19 4.5, 19 2"></path>`,
    'map-pin': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>`,
    'calendar': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>`,
    'tag': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>`
  };
  return icons[iconType] || icons['wine'];
};

const CategoriesGrid: React.FC<CategoriesGridProps> = ({ selectedCategory, onCategoryClick, preselectFirst = false }) => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {categories.map((category) => {
        const isSelected = selectedCategory?.id === category.id;
        const isFirst = categories[0].id === category.id;
        
        return (
          <button
            key={category.id}
            onClick={() => onCategoryClick(isSelected ? null : category)}
            className={`relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 active:scale-[0.98] ${
              isSelected
                ? `bg-gradient-to-br ${category.color} shadow-lg scale-[1.02]`
                : 'bg-white/90 backdrop-blur-sm border border-gray-200/50 hover:shadow-md'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-br opacity-10" style={{ background: `linear-gradient(to bottom right, var(--tw-gradient-from), var(--tw-gradient-to))` }}></div>
            <div className="relative z-10">
              <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl ${
                isSelected ? 'bg-white/20' : `bg-gradient-to-br ${category.color}`
              }`}>
                <svg
                  className={`h-6 w-6 ${isSelected ? 'text-white' : 'text-white'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  dangerouslySetInnerHTML={{ __html: getIconSVG(category.icon) }}
                />
              </div>
              <h3 className={`text-lg font-semibold mb-1 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                {category.name}
              </h3>
              <p className={`text-sm mb-2 ${isSelected ? 'text-white/90' : 'text-gray-600'}`}>
                {category.description}
              </p>
              <p className={`text-xs font-medium ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                {category.count}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default CategoriesGrid;


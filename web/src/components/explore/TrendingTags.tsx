/**
 * TrendingTags Component
 * Tags de tendencias para filtrar eventos
 */

import React from 'react';

export interface TrendingTag {
  id: string;
  name: string;
}

export const trendingTags: TrendingTag[] = [
  { id: 'nuevos', name: 'Nuevos' },
  { id: 'mejor-valorados', name: 'Mejor valorados' },
  { id: 'ofertas', name: 'Ofertas' },
  { id: 'sostenibles', name: 'Sostenibles' },
  { id: 'organicos', name: 'Orgánicos' }
];

export function getTrendingTagById(id: string): TrendingTag | undefined {
  return trendingTags.find(tag => tag.id === id);
}

interface TrendingTagsProps {
  selectedTag: TrendingTag | null;
  onTagClick: (tag: TrendingTag | null) => void;
  preselectFirst?: boolean;
}

const TrendingTags: React.FC<TrendingTagsProps> = ({ selectedTag, onTagClick, preselectFirst = false }) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {trendingTags.map((tag) => {
        const isSelected = selectedTag?.id === tag.id;
        
        return (
          <button
            key={tag.id}
            onClick={() => onTagClick(isSelected ? null : tag)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 active:scale-95 ${
              isSelected
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                : 'bg-white/90 backdrop-blur-sm border border-gray-200/50 text-gray-700 hover:border-purple-300 hover:bg-purple-50'
            }`}
          >
            {tag.name}
          </button>
        );
      })}
    </div>
  );
};

export default TrendingTags;


/**
 * Bottom Navigation Component
 * Navegación inferior de la aplicación
 * Migrado desde navigation.js
 */

import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === '/') {
      return currentPath === '/' || currentPath.includes('hero.html');
    }
    return currentPath.includes(path);
  };

  return (
    <nav className="pinot-bottom-nav border-t border-gray-200/50 bg-white/90 backdrop-blur-sm relative z-[10]">
      <div className="flex items-center justify-center px-4 py-2 max-w-md mx-auto">
        {/* Inicio */}
        <Link 
          to="/"
          className={`pinot-nav-item flex flex-col items-center gap-1 py-2 px-4 ${
            isActive('/') ? 'pinot-nav-item-active' : ''
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" d="M182.5 495.3 c-5.6 -1.4 -7.6 -9.1 -3.4 -12.9 2 -1.8 4.3 -1.9 35.5 -2.2 l33.4 -0.3 0 -82.8 0 -82.8 -7.7 -0.7 c-48.2 -4.4 -90 -35 -108.9 -79.7 -7.2 -17.2 -11.2 -39.5 -10 -56.5 0.9 -12.4 22.3 -154.4 23.7 -157.1 0.7 -1.2 2.5 -2.7 4.2 -3.3 4.2 -1.4 209.2 -1.4 213.4 0 1.7 0.6 3.5 2.1 4.1 3.3 1.5 2.7 23 144.8 23.8 157.2 1.2 16.9 -2.8 39.3 -10 56.4 -18.8 44.7 -60.7 75.3 -108.9 79.7 l-7.7 0.7 0 82.8 0 82.8 33.4 0.3 c31.2 0.3 33.5 0.4 35.5 2.2 2.9 2.6 2.9 8.6 0 11.2 -2 1.8 -4.8 1.9 -75.3 2 -40.2 0.1 -74 0 -75.1 -0.3z m114.9 -202.4 c33.6 -11.2 60.6 -38.1 72 -71.6 4.4 -13.1 6 -22.8 6 -37.3 -0.1 -12 -1.2 -21.1 -10.3 -80.5 -5.6 -36.9 -10.4 -68 -10.6 -69.2 l-0.5 -2.3 -63.8 0 -63.7 0 -9 68.3 c-8.3 62.7 -9 69.5 -9 84.7 0.1 18.3 1.5 27.1 6.7 42 5.9 16.6 13.8 29.7 24.9 41.5 11.6 12.2 24 20.4 38.4 25.6 6.9 2.4 8.4 2.3 18.9 -1.2z"/>
          </svg>
          <span className="text-xs font-medium">Inicio</span>
        </Link>
        
        {/* Explorar */}
        <Link 
          to="/explore"
          className={`pinot-nav-item flex flex-col items-center gap-1 py-2 px-4 ${
            isActive('/explore') ? 'pinot-nav-item-active' : ''
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-xs font-medium">Explorar</span>
        </Link>
        
        {/* Favoritos */}
        <Link 
          to="/favs"
          className={`pinot-nav-item flex flex-col items-center gap-1 py-2 px-4 ${
            isActive('/favs') ? 'pinot-nav-item-active' : ''
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="text-xs font-medium">Favoritos</span>
        </Link>
        
        {/* Perfil */}
        <Link 
          to="/profile"
          className={`pinot-nav-item flex flex-col items-center gap-1 py-2 px-4 ${
            isActive('/profile') ? 'pinot-nav-item-active' : ''
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-xs font-medium">Perfil</span>
        </Link>
      </div>
    </nav>
  );
};

export default BottomNavigation;



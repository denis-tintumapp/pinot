/**
 * Template HTML del Bottom Sheet
 * Retorna el HTML completo del Bottom Sheet como string
 */

export function renderBottomSheetHTML() {
  return `
  <!-- Overlay -->
  <div id="bottomSheetOverlay" class="fixed inset-0 bg-black/40 backdrop-blur-md backdrop-saturate-150 z-40 opacity-0 pointer-events-none transition-opacity duration-300" aria-hidden="true"></div>

  <!-- Bottom Sheet -->
  <div id="bottomSheet" class="fixed bottom-0 left-0 right-0 backdrop-blur-xl rounded-t-3xl shadow-2xl border-t border-white/30 z-50 transform translate-y-full transition-transform duration-300 ease-out max-h-[90vh] overflow-hidden flex flex-col" style="background-color: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="bottomSheetTitle">
          <!-- Handle Bar -->
          <div id="bottomSheetHandle" class="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none" style="touch-action: none;">
      <div class="w-12 h-1.5 bg-gray-300 rounded-full"></div>
    </div>
    
    <!-- Contenido del menú -->
    <div class="flex-1 overflow-y-auto px-4 pb-6">
      <h2 id="bottomSheetTitle" class="sr-only">Menú de navegación</h2>
      
      <!-- Opciones de navegación -->
      <nav class="space-y-2">
        <a href="/auth/login" class="bottom-sheet-item flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors">
          <svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
          <span class="text-base font-medium text-gray-900">Registrarse / Login</span>
        </a>
        
        <a href="/hero.html" class="bottom-sheet-item flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors">
          <svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
          </svg>
          <span class="text-base font-medium text-gray-900">Inicio</span>
        </a>
        
        <a href="/explore.html" class="bottom-sheet-item flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors">
          <svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <span class="text-base font-medium text-gray-900">Explorar</span>
        </a>
        
        <a href="/profile.html" class="bottom-sheet-item flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors">
          <svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
          <span class="text-base font-medium text-gray-900">Perfil</span>
        </a>
        
        <a href="/favs.html" class="bottom-sheet-item flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors">
          <svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
          </svg>
          <span class="text-base font-medium text-gray-900">Favoritos</span>
        </a>
      </nav>
      
      <!-- Divider -->
      <div class="border-t border-gray-200 my-4"></div>
      
      <!-- Acciones rápidas -->
      <div class="space-y-2">
        <button class="bottom-sheet-action flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors w-full text-left" aria-label="Compartir">
          <svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
          </svg>
          <span class="text-base font-medium text-gray-900">Compartir</span>
        </button>
        
        <button class="bottom-sheet-action flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors w-full text-left" aria-label="Marcar como favorito">
          <svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
          </svg>
          <span class="text-base font-medium text-gray-900">Favorito</span>
        </button>
      </div>
      
      <!-- Configuración -->
      <div class="border-t border-gray-200 my-4"></div>
      <button class="bottom-sheet-item flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors w-full text-left" aria-label="Configuración">
        <svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
        <span class="text-base font-medium text-gray-900">Configuración</span>
      </button>
    </div>
  </div>
  `;
}















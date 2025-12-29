/**
 * Bottom Sheet Component
 * Menú deslizable desde abajo estilo iOS
 * Migrado desde bottom-sheet.js y bottom-sheet-template.js
 */

import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// Importar directamente las clases y funciones de JavaScript
// Nota: Estos archivos aún están en JS/TS pero fuera de src
// Se importarán dinámicamente en runtime

const BottomSheet: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bottomSheetInstanceRef = useRef<any | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!containerRef.current) return;

    // Esperar a que el DOM esté completamente listo
    const initBottomSheet = async () => {
      // Pequeño delay para asegurar que menuToggle existe en el DOM
      await new Promise(resolve => setTimeout(resolve, 100));
      try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BottomSheet.tsx:initBottomSheet',message:'Iniciando inicialización',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'hypothesis_bs_2'})}).catch(()=>{});
        // #endregion
        // Importar dinámicamente las clases y funciones
        const [{ BottomSheet: BottomSheetClass }, { renderBottomSheetHTML }] = await Promise.all([
          import('../../../js/ui/bottom-sheet'),
          import('../../../js/ui/bottom-sheet-template'),
        ]);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BottomSheet.tsx:initBottomSheet',message:'Imports completados',data:{hasBottomSheetClass: !!BottomSheetClass, hasRenderHTML: typeof renderBottomSheetHTML === 'function'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'hypothesis_bs_2'})}).catch(()=>{});
        // #endregion

        // Crear contenedor temporal para parsear el HTML
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = renderBottomSheetHTML().trim();
        
        // Insertar los elementos directamente en el body
        const overlay = tempContainer.querySelector('#bottomSheetOverlay');
        const sheet = tempContainer.querySelector('#bottomSheet');
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BottomSheet.tsx:initBottomSheet',message:'Elementos parseados',data:{hasOverlay: !!overlay, hasSheet: !!sheet},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'hypothesis_bs_3'})}).catch(()=>{});
        // #endregion
        
        if (overlay && sheet) {
          // #region agent log
          const existingOverlay = document.getElementById('bottomSheetOverlay');
          const existingSheet = document.getElementById('bottomSheet');
          fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BottomSheet.tsx:initBottomSheet',message:'Verificando elementos existentes',data:{existingOverlay: !!existingOverlay, existingSheet: !!existingSheet, hasGlobalInstance: !!(window as any).__bottomSheetInstance},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'hypothesis_bs_6'})}).catch(()=>{});
          // #endregion
          
          let bottomSheet: any;
          
          // Si ya existen, usar instancia existente o crear una nueva
          if (existingOverlay && existingSheet) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BottomSheet.tsx:initBottomSheet',message:'Elementos ya existen, usando o creando instancia',data:{hasGlobalInstance: !!(window as any).__bottomSheetInstance},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'hypothesis_bs_6'})}).catch(()=>{});
            // #endregion
            
            // Si ya hay una instancia global, usarla
            if ((window as any).__bottomSheetInstance) {
              bottomSheet = (window as any).__bottomSheetInstance;
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BottomSheet.tsx:initBottomSheet',message:'Usando instancia global existente',data:{hasBottomSheet: !!bottomSheet, hasToggle: typeof bottomSheet.toggle === 'function'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'hypothesis_bs_6'})}).catch(()=>{});
              // #endregion
            } else {
              // Crear nueva instancia con los elementos existentes
              bottomSheet = new BottomSheetClass({
                element: existingSheet as HTMLElement,
                overlay: existingOverlay as HTMLElement,
                handleBar: document.getElementById('bottomSheetHandle') as HTMLElement,
              });
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BottomSheet.tsx:initBottomSheet',message:'Nueva instancia creada con elementos existentes',data:{hasBottomSheet: !!bottomSheet, hasToggle: typeof bottomSheet.toggle === 'function'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'hypothesis_bs_6'})}).catch(()=>{});
              // #endregion
            }
          } else {
            // Crear elementos nuevos
            document.body.appendChild(overlay);
            document.body.appendChild(sheet);
            
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BottomSheet.tsx:initBottomSheet',message:'Elementos insertados en DOM',data:{overlayInDOM: document.body.contains(overlay), sheetInDOM: document.body.contains(sheet)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'hypothesis_bs_3'})}).catch(()=>{});
            // #endregion
            
            // Crear instancia del Bottom Sheet
            bottomSheet = new BottomSheetClass({
              element: document.getElementById('bottomSheet') as HTMLElement,
              overlay: document.getElementById('bottomSheetOverlay') as HTMLElement,
              handleBar: document.getElementById('bottomSheetHandle') as HTMLElement,
            });
            
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BottomSheet.tsx:initBottomSheet',message:'BottomSheet instanciado',data:{hasBottomSheet: !!bottomSheet, hasToggle: typeof bottomSheet.toggle === 'function'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'hypothesis_bs_2'})}).catch(()=>{});
            // #endregion
          }
          
          bottomSheetInstanceRef.current = bottomSheet;
          
          // Guardar instancia global para uso compartido entre componentes
          (window as any).__bottomSheetInstance = bottomSheet;
          
          // Conectar menú hamburguesa al bottom sheet usando event delegation
          // Esto funciona incluso si React recrea el botón
          const globalClickHandler = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            
            // Ignorar clicks dentro del bottom sheet (manejados por otro handler)
            if (target.closest('#bottomSheet')) {
              return;
            }
            
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BottomSheet.tsx:globalClickHandler',message:'Global click handler ejecutado',data:{targetId: target.id, targetTagName: target.tagName, targetClassName: target.className, hasClosest: !!target.closest('#menuToggle')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'hypothesis_bs_16'})}).catch(()=>{});
            // #endregion
            
            const menuToggle = target.closest('#menuToggle');
            if (menuToggle) {
              e.preventDefault();
              e.stopPropagation();
              const instance = (window as any).__bottomSheetInstance;
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BottomSheet.tsx:globalClickHandler',message:'menuToggle clicked via delegation',data:{hasGlobalInstance: !!instance, hasToggle: instance ? typeof instance.toggle === 'function' : false, isOpen: instance ? instance.isOpen : undefined, targetId: target.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'hypothesis_bs_13'})}).catch(()=>{});
              // #endregion
              if (instance && typeof instance.toggle === 'function') {
                instance.toggle();
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BottomSheet.tsx:globalClickHandler',message:'Después de toggle',data:{isOpen: instance.isOpen},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'hypothesis_bs_13'})}).catch(()=>{});
                // #endregion
              }
            }
          };
          
          // Remover listener anterior si existe
          const existingGlobalHandler = (window as any).__bottomSheetGlobalClickHandler;
          if (existingGlobalHandler) {
            document.removeEventListener('click', existingGlobalHandler, { capture: true });
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BottomSheet.tsx:initBottomSheet',message:'Removiendo global click handler anterior',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'hypothesis_bs_13'})}).catch(()=>{});
            // #endregion
          }
          
          // Guardar referencia y agregar listener global
          (window as any).__bottomSheetGlobalClickHandler = globalClickHandler;
          document.addEventListener('click', globalClickHandler, { capture: true, passive: false }); // Usar capture phase y non-passive
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BottomSheet.tsx:initBottomSheet',message:'Global click handler agregado',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'hypothesis_bs_13'})}).catch(()=>{});
          // #endregion
          
          // Cerrar bottom sheet cuando se hace click en un enlace
          // Usar event delegation para los enlaces también, ya que pueden ser recreados
          const handleBottomSheetLinkClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const link = target.closest('a.bottom-sheet-item') as HTMLAnchorElement;
            if (link) {
              e.preventDefault();
              e.stopPropagation();
              const href = link.getAttribute('href');
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BottomSheet.tsx:handleBottomSheetLinkClick',message:'Link clicked in bottom sheet',data:{href: href},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'hypothesis_bs_17'})}).catch(()=>{});
              // #endregion
              if (href) {
                const instance = (window as any).__bottomSheetInstance;
                if (instance && typeof instance.close === 'function') {
                  instance.close();
                }
                // Convertir rutas .html a rutas React Router sin extensión
                let route = href;
                if (href.endsWith('.html')) {
                  route = href.replace('.html', '');
                }
                // Casos especiales: hero.html -> /
                if (route === '/hero') {
                  route = '/';
                }
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BottomSheet.tsx:handleBottomSheetLinkClick',message:'Navegando a ruta',data:{originalHref: href, route: route},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'hypothesis_bs_17'})}).catch(()=>{});
                // #endregion
                // Navegar con React Router si es una ruta interna
                if (route.startsWith('/') && !route.startsWith('//')) {
                  navigate(route);
                  // #region agent log
                  fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BottomSheet.tsx:handleBottomSheetLinkClick',message:'navigate() llamado',data:{route: route},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'hypothesis_bs_17'})}).catch(()=>{});
                  // #endregion
                }
              }
            }
          };
          
          // Remover handler anterior si existe
          const existingLinkHandler = (window as any).__bottomSheetLinkClickHandler;
          if (existingLinkHandler) {
            document.removeEventListener('click', existingLinkHandler, { capture: true });
          }
          
          // Guardar referencia y agregar listener global para los enlaces
          (window as any).__bottomSheetLinkClickHandler = handleBottomSheetLinkClick;
          document.addEventListener('click', handleBottomSheetLinkClick, { capture: true, passive: false });
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BottomSheet.tsx:initBottomSheet',message:'Link click handler agregado',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'hypothesis_bs_17'})}).catch(()=>{});
          // #endregion
        } else {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BottomSheet.tsx:initBottomSheet',message:'Elementos no encontrados en template',data:{hasOverlay: !!overlay, hasSheet: !!sheet},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'hypothesis_bs_3'})}).catch(()=>{});
          // #endregion
        }
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BottomSheet.tsx:initBottomSheet',message:'Error al inicializar',data:{error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'hypothesis_bs_2'})}).catch(()=>{});
        // #endregion
        console.error('Error al inicializar Bottom Sheet:', error);
      }
    };

    initBottomSheet();

    return () => {
      // NO remover elementos aquí - son compartidos entre todas las páginas
      // Solo limpiar la referencia local
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6ede2a79-1577-4a13-a474-32a2269e135c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BottomSheet.tsx:cleanup',message:'Cleanup ejecutado',data:{hasInstance: !!bottomSheetInstanceRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'hypothesis_bs_6'})}).catch(()=>{});
      // #endregion
      bottomSheetInstanceRef.current = null;
    };
  }, [navigate]);

  // Este componente no renderiza nada directamente
  // Los elementos se insertan en el body
  return <div ref={containerRef} style={{ display: 'none' }} />;
};

export default BottomSheet;


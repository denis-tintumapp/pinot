/**
 * Bottom Sheet estilo iOS
 * Componente que se desliza desde abajo con funcionalidad de arrastre para cerrar
 */

export class BottomSheet {
  constructor(options = {}) {
    this.element = options.element || document.getElementById('bottomSheet');
    this.overlay = options.overlay || document.getElementById('bottomSheetOverlay');
    this.handleBar = options.handleBar || document.getElementById('bottomSheetHandle');
    
    if (!this.element) {
      console.error('BottomSheet: Elemento no encontrado');
      return;
    }
    
    this.isOpen = false;
    this.isDragging = false;
    this.startY = 0;
    this.currentY = 0;
    this.startTranslateY = 0;
    this.threshold = options.threshold || 0.3; // 30% de altura para cerrar
    this.sheetHeight = 0;
    
    // Bind methods
    this._handleTouchStart = this._handleTouchStart.bind(this);
    this._handleTouchMove = this._handleTouchMove.bind(this);
    this._handleTouchEnd = this._handleTouchEnd.bind(this);
    this._handleOverlayClick = this._handleOverlayClick.bind(this);
    this._handleKeyDown = this._handleKeyDown.bind(this);
    
    this._init();
  }
  
  _init() {
    // Calcular altura del sheet
    this.sheetHeight = this.element.offsetHeight || this.element.scrollHeight;
    
    // Deshabilitar foco en elementos interactivos inicialmente (cuando está cerrado)
    this._setInteractiveElementsTabIndex(-1);
    
    // Event listeners para el handle bar
    if (this.handleBar) {
      this.handleBar.addEventListener('touchstart', this._handleTouchStart, { passive: false });
      this.handleBar.addEventListener('mousedown', this._handleMouseStart.bind(this));
      
      // También agregar touchmove y touchend solo al handle bar para permitir arrastre
      this.handleBar.addEventListener('touchmove', this._handleTouchMove, { passive: false });
      this.handleBar.addEventListener('touchend', this._handleTouchEnd, { passive: false });
    }
    
    // NO agregar touchmove/touchend al elemento completo - solo al handle bar
    // Esto permite que los enlaces funcionen correctamente sin interferir con el arrastre
    // this.element.addEventListener('touchmove', this._handleTouchMove, { passive: false });
    // this.element.addEventListener('touchend', this._handleTouchEnd, { passive: false });
    
    // Event listener para el overlay
    if (this.overlay) {
      this.overlay.addEventListener('click', this._handleOverlayClick);
    }
    
    // Event listener para tecla ESC
    document.addEventListener('keydown', this._handleKeyDown);
    
    // Prevenir scroll cuando est? abierto
    this._preventBodyScroll();
  }
  
  _handleMouseStart(e) {
    // Para desktop: convertir mouse events a touch-like behavior
    e.preventDefault();
    this.startY = e.clientY;
    this.startTranslateY = this._getCurrentTranslateY();
    this.isDragging = true;
    
    const handleMouseMove = (e) => {
      if (!this.isDragging) return;
      this.currentY = e.clientY;
      const deltaY = this.currentY - this.startY;
      this._updatePosition(deltaY);
    };
    
    const handleMouseEnd = () => {
      this.isDragging = false;
      this._handleDragEnd();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseEnd);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseEnd);
  }
  
  _handleTouchStart(e) {
    // Solo permitir arrastre desde el handle bar o desde la parte superior del sheet
    const touch = e.touches[0];
    const target = e.target;
    
    // Permitir arrastre desde handle bar o desde el ?rea superior del sheet
    const isHandleArea = target.closest('#bottomSheetHandle') || 
                         target === this.handleBar ||
                         (target === this.element && touch.clientY < 100);
    
    if (!isHandleArea && this.isOpen) {
      return; // No permitir arrastre desde el contenido scrolleable
    }
    
    this.startY = touch.clientY;
    this.startTranslateY = this._getCurrentTranslateY();
    this.isDragging = true;
    
    // Prevenir scroll mientras se arrastra
    e.preventDefault();
  }
  
  _handleTouchMove(e) {
    if (!this.isDragging) return;
    
    // NO prevenir default si el target es un enlace (permitir navegación)
    const target = e.target;
    if (target.closest('a') || target.tagName === 'A') {
      return; // Permitir navegación en enlaces
    }
    
    const touch = e.touches[0];
    this.currentY = touch.clientY;
    const deltaY = this.currentY - this.startY;
    
    // Solo permitir arrastre hacia abajo cuando est? abierto
    if (this.isOpen && deltaY > 0) {
      this._updatePosition(deltaY);
      e.preventDefault();
    }
  }
  
  _handleTouchEnd(e) {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    this._handleDragEnd();
  }
  
  _handleDragEnd() {
    const deltaY = this.currentY - this.startY;
    const currentTranslateY = this._getCurrentTranslateY();
    const thresholdPixels = this.sheetHeight * this.threshold;
    
    // Si se arrastr? m?s del threshold hacia abajo, cerrar
    if (deltaY > thresholdPixels && this.isOpen) {
      this.close();
    } else {
      // Snap back a posici?n abierta
      this._snapBack();
    }
    
    // Reset
    this.startY = 0;
    this.currentY = 0;
  }
  
  _updatePosition(deltaY) {
    // Calcular nueva posici?n (solo hacia abajo cuando est? abierto)
    if (!this.isOpen) return;
    
    const newTranslateY = Math.max(0, deltaY);
    this.element.style.transform = `translateY(${newTranslateY}px)`;
    this.element.style.transition = 'none'; // Desactivar transici?n durante el arrastre
    
    // Actualizar opacidad del overlay basado en la posici?n
    if (this.overlay) {
      const opacity = 1 - (newTranslateY / this.sheetHeight);
      this.overlay.style.opacity = opacity.toString();
    }
  }
  
  _snapBack() {
    // Volver a posici?n abierta con animaci?n
    this.element.style.transition = 'transform 0.3s ease-out';
    this.element.style.transform = 'translateY(0)';
    
    if (this.overlay) {
      this.overlay.style.transition = 'opacity 0.3s ease-out';
      this.overlay.style.opacity = '1';
    }
  }
  
  _getCurrentTranslateY() {
    const transform = window.getComputedStyle(this.element).transform;
    if (transform === 'none') return 0;
    const matrix = transform.match(/matrix.*\((.+)\)/);
    if (matrix) {
      const values = matrix[1].split(', ');
      return parseFloat(values[5]) || 0;
    }
    return 0;
  }
  
  _handleOverlayClick() {
    if (this.isOpen) {
      this.close();
    }
  }
  
  _handleKeyDown(e) {
    if (e.key === 'Escape' && this.isOpen) {
      this.close();
    }
  }
  
  _preventBodyScroll() {
    // Agregar/remover clase al body para prevenir scroll
    if (this.isOpen) {
      document.body.classList.add('bottom-sheet-open');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('bottom-sheet-open');
      document.body.style.overflow = '';
    }
  }
  
  _setInteractiveElementsTabIndex(value) {
    // Encontrar todos los elementos interactivos dentro del bottom sheet
    // Incluir elementos con cualquier tabindex (incluyendo -1) para poder restaurarlos
    const interactiveElements = this.element.querySelectorAll('a, button, input, select, textarea, [tabindex]');
    interactiveElements.forEach((el) => {
      if (value === -1) {
        // Guardar el tabindex original si existe para poder restaurarlo
        const currentTabIndex = el.getAttribute('tabindex');
        if (currentTabIndex !== '-1') {
          // Solo guardar si no es -1 (que es el valor que estamos estableciendo)
          if (currentTabIndex !== null) {
            el.setAttribute('data-original-tabindex', currentTabIndex);
          } else {
            // Si no tenía tabindex, guardar un marcador especial
            el.setAttribute('data-original-tabindex', '');
          }
        }
        el.setAttribute('tabindex', '-1');
      } else {
        // Restaurar el tabindex original o removerlo si no tenía uno
        const originalTabIndex = el.getAttribute('data-original-tabindex');
        if (originalTabIndex !== null) {
          if (originalTabIndex === '') {
            // No tenía tabindex originalmente, removerlo
            el.removeAttribute('tabindex');
          } else {
            // Restaurar el tabindex original
            el.setAttribute('tabindex', originalTabIndex);
          }
          el.removeAttribute('data-original-tabindex');
        } else {
          // Si no hay data-original-tabindex, asumir que no tenía tabindex
          el.removeAttribute('tabindex');
        }
      }
    });
  }
  
  open() {
    if (this.isOpen) return;
    
    this.isOpen = true;
    this.element.classList.remove('translate-y-full');
    this.element.classList.add('translate-y-0');
    
    if (this.overlay) {
      this.overlay.classList.remove('opacity-0', 'pointer-events-none');
      this.overlay.classList.add('opacity-100');
    }
    
    // Prevenir scroll del body
    this._preventBodyScroll();
    
    // Agregar atributos de accesibilidad
    this.element.setAttribute('aria-hidden', 'false');
    this.element.setAttribute('role', 'dialog');
    if (this.overlay) {
      this.overlay.setAttribute('aria-hidden', 'false');
    }
    
    // Habilitar foco en elementos interactivos cuando está abierto
    this._setInteractiveElementsTabIndex(0);
    
    // Recalcular altura despu?s de abrir
    setTimeout(() => {
      this.sheetHeight = this.element.offsetHeight || this.element.scrollHeight;
    }, 100);
  }
  
  close() {
    if (!this.isOpen) return;
    
    this.isOpen = false;
    this.element.classList.remove('translate-y-0');
    this.element.classList.add('translate-y-full');
    
    if (this.overlay) {
      this.overlay.classList.remove('opacity-100');
      this.overlay.classList.add('opacity-0', 'pointer-events-none');
    }
    
    // Restaurar scroll del body
    this._preventBodyScroll();
    
    // Deshabilitar foco en elementos interactivos cuando está cerrado
    // Esto previene que elementos con foco estén dentro de un elemento con aria-hidden="true"
    this._setInteractiveElementsTabIndex(-1);
    
    // Reset transform
    this.element.style.transform = '';
    this.element.style.transition = '';
    if (this.overlay) {
      this.overlay.style.opacity = '';
      this.overlay.style.transition = '';
    }
    
    // Actualizar atributos de accesibilidad
    this.element.setAttribute('aria-hidden', 'true');
    if (this.overlay) {
      this.overlay.setAttribute('aria-hidden', 'true');
    }
  }
  
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
  
  destroy() {
    // Remover event listeners
    if (this.handleBar) {
      this.handleBar.removeEventListener('touchstart', this._handleTouchStart);
      this.handleBar.removeEventListener('touchmove', this._handleTouchMove);
      this.handleBar.removeEventListener('touchend', this._handleTouchEnd);
      this.handleBar.removeEventListener('mousedown', this._handleMouseStart);
    }
    if (this.overlay) {
      this.overlay.removeEventListener('click', this._handleOverlayClick);
    }
    document.removeEventListener('keydown', this._handleKeyDown);
    
    // Cerrar si est? abierto
    if (this.isOpen) {
      this.close();
    }
  }
}















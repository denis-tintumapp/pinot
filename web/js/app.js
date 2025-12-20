import { listarEventos } from './eventos.js';
import { initNaipeSelect, renderEtiquetas, renderNaipesSeleccionados } from './etiquetas.js';
import { initAdmin } from './admin.js';

// Registrar Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js"));
}

// Instalación como PWA
let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const installBtn = document.getElementById("installBtn");
  if (installBtn) {
    installBtn.classList.remove("hidden");
  }
});

// Inicialización cuando el DOM esté listo
function inicializar() {
  const installBtn = document.getElementById("installBtn");
  if (installBtn) {
    installBtn.onclick = async () => {
      installBtn.classList.add("hidden");
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
    };
  }
  
  // Inicializar componentes
  try {
    initNaipeSelect();
    renderEtiquetas();
    renderNaipesSeleccionados();
    listarEventos();
    initAdmin();
    
    const yearElement = document.getElementById("y");
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
    }
  } catch (error) {
    console.error("Error al inicializar la aplicación:", error);
  }
}

// Esperar a que el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializar);
} else {
  inicializar();
}


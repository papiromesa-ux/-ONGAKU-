document.addEventListener('DOMContentLoaded', () => {
  const toast = document.getElementById('toast-msg');

  function mostrarMensaje(texto) {
    toast.textContent = texto;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  // 1. Calidad de Audio (Alternar)
  const btnCalidad = document.getElementById('btn-calidad');
  const txtCalidad = document.getElementById('txt-calidad');
  let calidadAlta = true;

  if(btnCalidad) {
    btnCalidad.onclick = () => {
      calidadAlta = !calidadAlta;
      txtCalidad.textContent = calidadAlta ? "Alta (320kbps)" : "Estándar (128kbps)";
      localStorage.setItem('ongaku_calidad', calidadAlta ? 'alta' : 'estandar');
      mostrarMensaje(calidadAlta ? "Calidad Alta Activada" : "Calidad Estándar Activada");
    };
  }

  // 2. Modo sin conexión (Toggle)
  const btnOffline = document.getElementById('btn-offline');
  const toggleOffline = document.getElementById('toggle-offline');
  
  if(btnOffline) {
    btnOffline.onclick = () => {
      const isActive = toggleOffline.classList.contains('active');
      if(isActive) {
        toggleOffline.classList.remove('active');
        localStorage.setItem('ongaku_offline', 'false');
        mostrarMensaje("Modo sin conexión Desactivado");
      } else {
        toggleOffline.classList.add('active');
        localStorage.setItem('ongaku_offline', 'true');
        mostrarMensaje("Modo sin conexión Activado (Ahorro de datos)");
      }
    };
  }

  // 3. Borrar Caché
  const btnCache = document.getElementById('btn-cache');
  if(btnCache) {
    btnCache.onclick = () => {
      // Borra la música guardada pero no la sesión
      localStorage.removeItem('ongaku_src');
      localStorage.removeItem('ongaku_title');
      localStorage.removeItem('ongaku_time');
      mostrarMensaje("Caché de música borrada");
      setTimeout(() => location.reload(), 1500);
    };
  }
});

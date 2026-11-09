// Inyectar el HTML del reproductor completo en todas las páginas
document.body.insertAdjacentHTML('beforeend', `
  <div id="full-player" class="full-player">
    <header class="full-header glass">
      <button type="button" id="btn-close-full" class="btn-icon" aria-label="Cerrar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>
      <span class="header-title">REPRODUCIENDO</span>
      <button type="button" id="btn-queue" class="btn-icon" aria-label="Cola de reproducción">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
      </button>
    </header>

    <div class="player-main" id="player-main">
      <div class="cover-wrapper">
        <div class="pulse-ring"></div>
        <div class="full-cover" id="full-cover"></div>
      </div>
      <div class="full-info">
        <h2 id="full-title">Selecciona una canción</h2>
        <p id="full-artist">ONGAKU Lofi</p>
      </div>
      
      <div class="progress-container">
        <div class="progress-bar"><div id="progress-fill" class="progress-fill"></div></div>
        <div class="time-labels"><span id="time-current">0:00</span><span id="time-total">0:00</span></div>
      </div>

      <div class="full-controls">
        <button type="button" class="btn-control" id="btn-shuffle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg></button>
        <button type="button" class="btn-control" id="btn-prev"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button>
        <button type="button" class="btn-play-main" id="btn-play-full">
          <svg id="icon-play-full" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
        <button type="button" class="btn-control" id="btn-next"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></button>
        <button type="button" class="btn-control" id="btn-repeat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg></button>
      </div>

      <div class="extra-actions">
        <button type="button" id="btn-heart" class="btn-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg></button>
        <button type="button" id="btn-share" class="btn-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg></button>
        <button type="button" id="btn-timer" class="btn-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></button>
      </div>
    </div>

    <!-- COLA DE REPRODUCCIÓN (Se desliza desde abajo) -->
    <div class="queue-panel" id="queue-panel">
      <div class="queue-header">
        <h3>COLA DE REPRODUCCIÓN</h3>
        <button type="button" id="btn-close-queue" class="btn-icon">X</button>
      </div>
      <ul id="queue-list" class="song-list"></ul>
    </div>
  </div>
`);

document.addEventListener('DOMContentLoaded', () => {
  const audio = document.getElementById('audio-player');
  const miniPlayer = document.getElementById('mini-player');
  const fullPlayer = document.getElementById('full-player');
  const btnCloseFull = document.getElementById('btn-close-full');
  
  // Elementos del reproductor grande
  const fullTitle = document.getElementById('full-title');
  const miniTitle = document.getElementById('mini-title');
  const btnPlayFull = document.getElementById('btn-play-full');
  const iconPlayFull = document.getElementById('icon-play-full');
  const btnPlayMini = document.getElementById('mini-play');
  const iconMiniPlay = document.getElementById('mini-icon-play');
  const progressFill = document.getElementById('progress-fill');
  const timeCurrent = document.getElementById('time-current');
  const timeTotal = document.getElementById('time-total');
  const coverFull = document.getElementById('full-cover');
  const coverMini = document.getElementById('mini-cover');
  const btnNext = document.getElementById('btn-next');
  const btnPrev = document.getElementById('btn-prev');
  const btnShare = document.getElementById('btn-share');
  const btnTimer = document.getElementById('btn-timer');
  const btnQueue = document.getElementById('btn-queue');
  const queuePanel = document.getElementById('queue-panel');
  const btnCloseQueue = document.getElementById('btn-close-queue');

  // Sonidos Click (ASMR)
  const sonidos = [
    new Audio('resources/audio/click1.mp3'),
    new Audio('resources/audio/click2.mp3'),
    new Audio('resources/audio/click3.mp3')
  ];
  document.querySelectorAll('.btn-sonido').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = sonidos[Math.floor(Math.random() * sonidos.length)];
      if(s) { s.currentTime = 0; s.volume = 0.2; s.play().catch(e => {}); }
    });
  });

  let isPlaying = false;
  let isTimerActive = false;

  // Recuperar estado
  const savedSrc = localStorage.getItem('ongaku_src');
  const savedTitle = localStorage.getItem('ongaku_title');
  const savedTime = localStorage.getItem('ongaku_time');

  if (savedSrc) {
    audio.src = savedSrc;
    if (fullTitle) fullTitle.textContent = savedTitle;
    if (miniTitle) miniTitle.textContent = savedTitle;
    if (coverFull) coverFull.style.backgroundImage = "url('img/japon1.jpg')";
    if (coverMini) coverMini.style.backgroundImage = "url('img/japon1.jpg')";
  }

  // Abrir reproductor completo
  if (miniPlayer) {
    miniPlayer.addEventListener('click', (e) => {
      if (!e.target.closest('button')) fullPlayer.classList.add('active');
    });
  }

  // Cerrar reproductor completo
  if (btnCloseFull) btnCloseFull.onclick = () => fullPlayer.classList.remove('active');

  // Control de Play/Pause
  function togglePlay() {
    if (!audio.src) return;
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
      if(iconPlayFull) iconPlayFull.innerHTML = '<path d="M8 5v14l11-7z"/>';
      if(iconMiniPlay) iconMiniPlay.innerHTML = '<path d="M8 5v14l11-7z"/>';
    } else {
      audio.play().then(() => {
        isPlaying = true;
        if(iconPlayFull) iconPlayFull.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
        if(iconMiniPlay) iconMiniPlay.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
      }).catch(e => console.log("Bloqueado"));
    }
  }

  if(btnPlayFull) btnPlayFull.onclick = togglePlay;
  if(btnPlayMini) btnPlayMini.onclick = togglePlay;

  // Progreso
  audio.ontimeupdate = () => {
    const pct = (audio.currentTime / audio.duration) * 100;
    if(progressFill) progressFill.style.width = `${pct || 0}%`;
    if(timeCurrent) timeCurrent.textContent = isNaN(audio.currentTime) ? "0:00" : `${Math.floor(audio.currentTime/60)}:${Math.floor(audio.currentTime%60).toString().padStart(2,'0')}`;
  };
  audio.onloadedmetadata = () => {
    if(timeTotal) timeTotal.textContent = isNaN(audio.duration) ? "0:00" : `${Math.floor(audio.duration/60)}:${Math.floor(audio.duration%60).toString().padStart(2,'0')}`;
  };

  // Botón Compartir (Nativo)
  if(btnShare) {
    btnShare.onclick = async () => {
      if (navigator.share) {
        try {
          await navigator.share({ title: 'Escuchando en ONGAKU', text: fullTitle.textContent, url: window.location.href });
        } catch (err) { console.log('Error compartiendo', err); }
      } else {
        alert("Tu navegador no soporta compartir.");
      }
    };
  }

  // Botón Temporizador (Simple)
  if(btnTimer) {
    btnTimer.onclick = () => {
      if (isTimerActive) {
        isTimerActive = false;
        alert("Temporizador desactivado.");
      } else {
        isTimerActive = true;
        alert("Temporizador activado: La música se pausará en 30 minutos.");
        setTimeout(() => {
          if (isTimerActive) { audio.pause(); isPlaying = false; btnPlayFull.click(); }
        }, 30 * 60 * 1000); // 30 mins
      }
    };
  }

  // Abrir/Cerrar Cola de reproducción
  if(btnQueue) btnQueue.onclick = () => queuePanel.classList.add('active');
  if(btnCloseQueue) btnCloseQueue.onclick = () => queuePanel.classList.remove('active');

  // Guardar estado al salir
  window.addEventListener('beforeunload', () => {
    if (audio && audio.src) {
      localStorage.setItem('ongaku_time', audio.currentTime);
      localStorage.setItem('ongaku_isPlaying', isPlaying);
      localStorage.setItem('ongaku_src', audio.src);
      localStorage.setItem('ongaku_title', fullTitle.textContent);
    }
  });

  // Reanudar al entrar
  window.addEventListener('load', () => {
    if (savedTime && audio) audio.currentTime = parseFloat(savedTime);
    if (localStorage.getItem('ongaku_isPlaying') === 'true' && audio) {
      audio.play().then(() => {
        isPlaying = true;
        if(iconPlayFull) iconPlayFull.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
        if(iconMiniPlay) iconMiniPlay.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
      }).catch(e => console.log("Tap to play"));
    }
  });
});

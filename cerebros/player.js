// Este archivo se cargará en TODOS los HTML para que la música no se corte.

const audio = document.getElementById('audio-player');
const miniTitle = document.getElementById('mini-title');
const miniPlayBtn = document.getElementById('mini-play');
const miniIcon = document.getElementById('mini-icon-play');
const miniCover = document.getElementById('mini-cover');

// Recuperar estado de la música
let isPlaying = false;
const savedSrc = localStorage.getItem('ongaku_src');
const savedTitle = localStorage.getItem('ongaku_title');
const savedTime = localStorage.getItem('ongaku_time');

if (savedSrc && audio) {
  audio.src = savedSrc;
  if (miniTitle) miniTitle.textContent = savedTitle;
  if (miniCover) miniCover.style.backgroundImage = "url('../img/japon1.jpg')";
}

// Sonidos Click
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

// Control de Play/Pause
function togglePlayGlobal() {
  if (!audio.src) return; // Si no hay canción, no hace nada
  if (isPlaying) {
    audio.pause();
    isPlaying = false;
    if (miniIcon) miniIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
  } else {
    audio.play().then(() => {
      isPlaying = true;
      if (miniIcon) miniIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
    }).catch(e => console.log("Bloqueado"));
  }
}

if (miniPlayBtn) miniPlayBtn.onclick = togglePlayGlobal;

// Guardar progreso antes de salir de la página
window.addEventListener('beforeunload', () => {
  if (audio && audio.src) {
    localStorage.setItem('ongaku_time', audio.currentTime);
    localStorage.setItem('ongaku_isPlaying', isPlaying);
    localStorage.setItem('ongaku_src', audio.src);
    localStorage.setItem('ongaku_title', miniTitle.textContent);
  }
});

// Reanudar al entrar a la nueva página
window.addEventListener('load', () => {
  if (savedTime && audio) {
    audio.currentTime = parseFloat(savedTime);
  }
  if (localStorage.getItem('ongaku_isPlaying') === 'true' && audio) {
    audio.play().then(() => {
      isPlaying = true;
      if (miniIcon) miniIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
    }).catch(e => console.log("El navegador requiere un toque para reanudar"));
  }
});

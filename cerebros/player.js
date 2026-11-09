import { _db, _secAuth } from "../firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

// 1. Inyectar el HTML completo
document.body.insertAdjacentHTML('beforeend', `
  <div id="full-player" class="full-player">
    <header class="full-header glass">
      <button type="button" id="btn-close-full" class="btn-icon" aria-label="Cerrar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>
      <span class="header-title">REPRODUCIENDO</span>
      <button type="button" class="btn-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
      </button>
    </header>
    <div class="player-main">
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
      <div class="full-controls glass">
        <button type="button" class="btn-control" id="btn-shuffle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg></button>
        <button type="button" class="btn-control" id="btn-prev"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button>
        <button type="button" class="btn-play-main" id="btn-play-full">
          <svg id="icon-play-full" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
        <button type="button" class="btn-control" id="btn-next"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></button>
        <button type="button" class="btn-control" id="btn-repeat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg></button>
      </div>
      <div class="extra-actions glass">
        <button type="button" id="btn-heart" class="btn-icon btn-heart"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg></button>
        <button type="button" id="btn-share" class="btn-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg></button>
        <button type="button" id="btn-timer" class="btn-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></button>
      </div>
    </div>
  </div>
`);

// 2. Selección de elementos (Ahora sí, después de inyectar el HTML)
const audio = document.getElementById('audio-player');
const fullPlayer = document.getElementById('full-player');
const miniPlayer = document.getElementById('mini-player');
const btnCloseFull = document.getElementById('btn-close-full');
const btnPlayFull = document.getElementById('btn-play-full');
const btnPlayMini = document.getElementById('mini-play');
const iconPlayFull = document.getElementById('icon-play-full');
const iconMiniPlay = document.getElementById('mini-icon-play');
const fullTitle = document.getElementById('full-title');
const miniTitle = document.getElementById('mini-title');
const coverFull = document.getElementById('full-cover');
const coverMini = document.getElementById('mini-cover');
const progressFill = document.getElementById('progress-fill');
const timeCurrent = document.getElementById('time-current');
const timeTotal = document.getElementById('time-total');
const btnHeart = document.getElementById('btn-heart');

let isPlaying = false;
let usuarioActual = null;
let misFavoritos = [];

// 3. Funciones base
function setPlayIcons(playing) {
  const path = playing ? '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>' : '<path d="M8 5v14l11-7z"/>';
  if(iconPlayFull) iconPlayFull.innerHTML = path;
  if(iconMiniPlay) iconMiniPlay.innerHTML = path;
}

function reproducir() {
  if (!audio.src) return;
  audio.play().then(() => { isPlaying = true; setPlayIcons(true); }).catch(e => console.log("Tap requerido"));
}

function pausar() {
  audio.pause();
  isPlaying = false;
  setPlayIcons(false);
}

function togglePlay() { isPlaying ? pausar() : reproducir(); }

// 4. Actualizar Interfaz (El arreglo del título)
function actualizarUI(titulo, src) {
  if(fullTitle) fullTitle.textContent = titulo;
  if(miniTitle) miniTitle.textContent = titulo;
  
  // Usamos una URL absoluta para la imagen para evitar problemas de rutas
  const rutaImg = "https://papiromesa-ux.github.io/-ONGAKU-/img/japon1.jpg";
  if(coverFull) coverFull.style.backgroundImage = `url('${rutaImg}')`;
  if(coverMini) coverMini.style.backgroundImage = `url('${rutaImg}')`;
  
  if (audio.src !== src) {
    audio.src = src;
    localStorage.setItem('ongaku_title', titulo);
    localStorage.setItem('ongaku_src', src);
  }
  
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: titulo, artist: 'ONGAKU Lofi', album: 'MizushiKode',
      artwork: [{ src: 'https://papiromesa-ux.github.io/-MIZUSHIKODE-/assets/img/icon-musica-512.png', sizes: '512x512', type: 'image/png' }]
    });
  }
  actualizarCorazonUI(titulo);
}

// 5. Escuchar el evento de las listas (library.js y search.js)
document.addEventListener('play-song', (e) => {
  const { titulo, src } = e.detail;
  actualizarUI(titulo, src);
  reproducir();
  if(fullPlayer) fullPlayer.classList.add('active');
});

// 6. Eventos de los botones (Asignados con onclick para que funcionen seguro)
if(btnCloseFull) btnCloseFull.onclick = () => fullPlayer.classList.remove('active');
if(btnPlayFull) btnPlayFull.onclick = togglePlay;
if(btnPlayMini) btnPlayMini.onclick = togglePlay;
if(miniPlayer) miniPlayer.onclick = (e) => { if (!e.target.closest('button')) fullPlayer.classList.add('active'); };

// Progreso del audio
audio.ontimeupdate = () => {
  const pct = (audio.currentTime / audio.duration) * 100;
  if(progressFill) progressFill.style.width = `${pct || 0}%`;
  if(timeCurrent) timeCurrent.textContent = isNaN(audio.currentTime) ? "0:00" : `${Math.floor(audio.currentTime/60)}:${Math.floor(audio.currentTime%60).toString().padStart(2,'0')}`;
};
audio.onloadedmetadata = () => {
  if(timeTotal) timeTotal.textContent = isNaN(audio.duration) ? "0:00" : `${Math.floor(audio.duration/60)}:${Math.floor(audio.duration%60).toString().padStart(2,'0')}`;
};

// 7. Firebase Auth
onAuthStateChanged(_secAuth, async (user) => {
  if (user) {
    usuarioActual = user;
    const docRef = doc(_db, "estudiantes", user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      misFavoritos = docSnap.data().favoritos || [];
      actualizarCorazonUI(fullTitle ? fullTitle.textContent : "");
    }
  }
});

// 8. Lógica del Corazón
function actualizarCorazonUI(titulo) {
  if (!btnHeart || !titulo) return;
  if (misFavoritos.includes(titulo)) btnHeart.classList.add('liked');
  else btnHeart.classList.remove('liked');
}

if(btnHeart) {
  btnHeart.onclick = async () => {
    if (!usuarioActual || !fullTitle || fullTitle.textContent === "Selecciona una canción") return;
    const t = fullTitle.textContent;
    const docRef = doc(_db, "estudiantes", usuarioActual.uid);

    if (misFavoritos.includes(t)) {
      await updateDoc(docRef, { favoritos: arrayRemove(t) });
      misFavoritos = misFavoritos.filter(c => c !== t);
    } else {
      await updateDoc(docRef, { favoritos: arrayUnion(t) });
      misFavoritos.push(t);
    }
    actualizarCorazonUI(t);
  };
}

// 9. Recuperar estado al cambiar de página
const savedSrc = localStorage.getItem('ongaku_src');
const savedTitle = localStorage.getItem('ongaku_title');
const savedTime = localStorage.getItem('ongaku_time');

if (savedSrc && savedTitle) {
  actualizarUI(savedTitle, savedSrc);
  audio.currentTime = parseFloat(savedTime) || 0;
  isPlaying = false;
  setPlayIcons(false);
}

// Guardar progreso al salir
window.addEventListener('beforeunload', () => {
  if (audio && audio.src) {
    localStorage.setItem('ongaku_time', audio.currentTime);
    localStorage.setItem('ongaku_isPlaying', isPlaying);
  }
});

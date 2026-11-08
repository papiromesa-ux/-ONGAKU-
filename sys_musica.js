import { _db, _secAuth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  
  const GITHUB_USER = "papiromesa-ux";
  const GITHUB_REPO = "-ONGAKU-";
  const GITHUB_BRANCH = "main";
  const CARPETA_MUSICA = "musicas/fondo";

  let canciones = [];
  let currentTrackIndex = 0;
  let isPlaying = false;
  let usuarioActual = null;
  let misFavoritos = [];

  // Elementos
  const audio = document.getElementById('audio-player');
  const loadingScreen = document.getElementById('loading-screen');
  const listaCanciones = document.getElementById('lista-canciones');
  const listaTendencias = document.getElementById('lista-tendencias');
  const buscador = document.getElementById('buscador');
  const miniTitle = document.getElementById('mini-title');
  const btnMiniPlay = document.getElementById('mini-play');
  const miniIconPlay = document.getElementById('mini-icon-play');
  const fullPlayer = document.getElementById('full-player');
  const btnCloseFull = document.getElementById('btn-close-full');
  const fullTitle = document.getElementById('full-title');
  const btnPlayMain = document.getElementById('btn-play-main');
  const iconPlayMain = document.getElementById('icon-play-main');
  const progressFill = document.getElementById('progress-fill');
  const timeCurrent = document.getElementById('time-current');
  const timeTotal = document.getElementById('time-total');
  const btnNext = document.getElementById('btn-next');
  const btnPrev = document.getElementById('btn-prev');
  const btnHeartFull = document.getElementById('btn-heart-full');

  // --- 1. SONIDOS CLICK ---
  const sonidos = [
    new Audio('resources/audio/click1.mp3'),
    new Audio('resources/audio/click2.mp3'),
    new Audio('resources/audio/click3.mp3')
  ];
  document.querySelectorAll('.btn-sonido').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = sonidos[Math.floor(Math.random() * sonidos.length)];
      s.currentTime = 0; s.volume = 0.3; s.play().catch(e => {});
    });
  });

  // --- 2. SALUDO DINÁMICO (Se ejecuta al instante) ---
  function actualizarSaludo(genero = 'hombre') {
    const hora = new Date().getHours();
    const esFemenino = genero.toLowerCase() === 'mujer' || genero.toLowerCase() === 'femenino';
    let saludo = "";

    if (hora >= 1 && hora < 7) saludo = esFemenino ? "Hola, Madrugadora" : "Hola, Madrugador";
    else if (hora >= 7 && hora < 13) saludo = "Buenos días";
    else if (hora >= 13 && hora < 19) saludo = "Buen provecho";
    else if (hora >= 19 && hora < 22) saludo = "Buenas noches";
    else saludo = esFemenino ? "Hola, Noctámbura" : "Hola, Noctámbulo";
    
    const el = document.getElementById('dynamic-greeting');
    if(el) el.textContent = saludo;
  }
  actualizarSaludo(); // Lo llamamos de una vez para que no diga "Cargando"

  // --- 3. FIREBASE (Sin bloquear la app) ---
  try {
    onAuthStateChanged(_secAuth, async (user) => {
      if (user) {
        usuarioActual = user;
        const userEl = document.getElementById('user-display-name');
        if(userEl) userEl.textContent = user.displayName || user.email.split('@')[0];

        const docRef = doc(_db, "estudiantes", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          misFavoritos = data.favoritos || [];
          actualizarSaludo(data.genero);
        }
      } else {
        // Punto 17: Si no hay sesión, mandar al login de la Academia
        window.location.href = "https://papiromesa-ux.github.io/-MIZUSHIKODE-/pages/login.html";
      }
    });
  } catch(e) { console.log("Firebase lento, pero la app funciona."); }

  // --- 4. CARGAR CANCIONES ---
  async function cargarMusicaDesdeGitHub() {
    try {
      const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${CARPETA_MUSICA}?ref=${GITHUB_BRANCH}&per_page=100`;
      const res = await fetch(url);
      const archivos = await res.json();

      canciones = archivos.filter(a => a.name.endsWith('.mp3')).map(a => ({
        titulo: a.name.replace('.mp3', '').replace(/_/g, ' '),
        src: a.download_url
      }));

      listaCanciones.innerHTML = ''; listaTendencias.innerHTML = '';
      canciones.slice(0, 5).forEach((c, i) => listaTendencias.appendChild(crearItem(c, i)));
      canciones.forEach((c, i) => listaCanciones.appendChild(crearItem(c, i)));

      if(canciones.length > 0) cargarCancion(0);
      
      // Quitar pantalla de carga
      if(loadingScreen) loadingScreen.classList.add('hidden');

      // Avisar al otro archivo que cargue los 3D
      document.dispatchEvent(new Event('ongakuReady'));

    } catch (error) {
      console.error("Error:", error);
      if(loadingScreen) loadingScreen.classList.add('hidden');
    }
  }

  function crearItem(cancion, index) {
    const li = document.createElement('li');
    li.className = `song-item ${index === currentTrackIndex ? 'playing' : ''}`;
    li.innerHTML = `
      <div class="song-cover"></div>
      <div class="song-info">
        <div class="song-title">${cancion.titulo}</div>
        <div class="song-artist">ONGAKU Lofi</div>
      </div>
    `;
    li.onclick = () => { cargarCancion(index); reproducir(); fullPlayer.classList.add('active'); };
    return li;
  }

  // --- 5. BOTONES Y REPRODUCTOR ---
  function cargarCancion(index) {
    if(!canciones[index]) return;
    currentTrackIndex = index;
    audio.src = canciones[index].src;
    miniTitle.textContent = canciones[index].titulo;
    fullTitle.textContent = canciones[index].titulo;
  }

  function reproducir() { audio.play().then(() => { isPlaying = true; actualizarIconos(true); }).catch(e=>{}); }
  function pausar() { audio.pause(); isPlaying = false; actualizarIconos(false); }
  function togglePlay() { isPlaying ? pausar() : reproducir(); }
  
  function actualizarIconos(playing) {
    const icon = playing ? '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>' : '<path d="M8 5v14l11-7z"/>';
    miniIconPlay.innerHTML = icon; iconPlayMain.innerHTML = icon;
  }

  btnMiniPlay.onclick = togglePlay;
  btnPlayMain.onclick = togglePlay;
  btnNext.onclick = () => { currentTrackIndex = (currentTrackIndex + 1) % canciones.length; cargarCancion(currentTrackIndex); if(isPlaying) reproducir(); };
  btnPrev.onclick = () => { currentTrackIndex = (currentTrackIndex - 1 + canciones.length) % canciones.length; cargarCancion(currentTrackIndex); if(isPlaying) reproducir(); };
  
  document.getElementById('mini-player').onclick = (e) => { if(!e.target.closest('button')) fullPlayer.classList.add('active'); };
  btnCloseFull.onclick = () => fullPlayer.classList.remove('active');

  audio.ontimeupdate = () => {
    progressFill.style.width = `${(audio.currentTime / audio.duration) * 100 || 0}%`;
    timeCurrent.textContent = formatearTiempo(audio.currentTime);
  };
  audio.onloadedmetadata = () => { timeTotal.textContent = formatearTiempo(audio.duration); };
  
  function formatearTiempo(s) { return isNaN(s) ? "0:00" : `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`; }

  btnHeartFull.onclick = async () => {
    if(!usuarioActual || !canciones[currentTrackIndex]) return;
    const c = canciones[currentTrackIndex].titulo;
    const ref = doc(_db, "estudiantes", usuarioActual.uid);
    if (misFavoritos.includes(c)) { await updateDoc(ref, { favoritos: arrayRemove(c) }); misFavoritos = misFavoritos.filter(x => x !== c); btnHeartFull.classList.remove('active'); }
    else { await updateDoc(ref, { favoritos: arrayUnion(c) }); misFavoritos.push(c); btnHeartFull.classList.add('active'); }
  };

  buscador.oninput = (e) => {
    const txt = e.target.value.toLowerCase();
    document.getElementById('lista-busqueda').innerHTML = '';
    if(!txt) return;
    canciones.filter(c => c.titulo.toLowerCase().includes(txt)).forEach(c => {
      document.getElementById('lista-busqueda').appendChild(crearItem(c, canciones.findIndex(o => o.titulo === c.titulo)));
    });
  };

  // INICIAR
  cargarMusicaDesdeGitHub();
});

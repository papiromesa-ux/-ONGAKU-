import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from 'https://cdn.jsdelivr.net/npm/@pixiv/three-vrm@3.0.0/lib/three-vrm.module.js';
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
  let isShuffle = false;
  let isRepeat = false;
  let usuarioActual = null;
  let misFavoritos = [];

  const audio = document.getElementById('audio-player');
  const listaCanciones = document.getElementById('lista-canciones');
  const listaTendencias = document.getElementById('lista-tendencias');
  const listaFiltrada = document.getElementById('lista-filtrada');
  const listaBusqueda = document.getElementById('lista-busqueda');
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
  const btnShuffle = document.getElementById('btn-shuffle');
  const btnRepeat = document.getElementById('btn-repeat');
  const btnHeartFull = document.getElementById('btn-heart-full');
  const fullCover = document.getElementById('full-cover');

  // --- 1. FIREBASE & SSO ---
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
        actualizarCorazonUI();
      }
    } else {
      window.location.href = "https://papiromesa-ux.github.io/-MIZUSHIKODE-/pages/login.html";
    }
  });

  function actualizarSaludo(genero = 'hombre') {
    const hora = new Date().getHours();
    const esFemenino = genero.toLowerCase() === 'mujer' || genero.toLowerCase() === 'femenino';
    let saludo = "";

    if (hora >= 1 && hora < 7) saludo = esFemenino ? "Hola, Madrugadora" : "Hola, Madrugador";
    else if (hora >= 7 && hora < 13) saludo = "Buenos días";
    else if (hora >= 13 && hora < 19) saludo = "Buen provecho";
    else if (hora >= 19 && hora < 22) saludo = "Buenas noches";
    else saludo = esFemenino ? "Hola, Noctámbura" : "Hola, Noctámbulo";
    
    const greetingEl = document.getElementById('dynamic-greeting');
    if(greetingEl) greetingEl.textContent = saludo;
  }

  // --- 2. SONIDOS ASMR (Ruta: resources/audio/click1.mp3) ---
  const sonidoClick = new Audio('resources/audio/click1.mp3');
  document.querySelectorAll('.btn-sonido').forEach(btn => {
    btn.addEventListener('click', () => {
      sonidoClick.currentTime = 0;
      sonidoClick.volume = 0.3;
      sonidoClick.play().catch(e => {});
    });
  });

  // --- 3. CARGAR MÚSICA (Ruta: musicas/fondo) ---
  async function cargarMusicaDesdeGitHub() {
    try {
      const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${CARPETA_MUSICA}?ref=${GITHUB_BRANCH}&per_page=100`;
      const res = await fetch(url);
      const archivos = await res.json();

      canciones = archivos.filter(a => a.name.endsWith('.mp3')).map(a => ({
        titulo: a.name.replace('.mp3', '').replace(/_/g, ' '),
        src: a.download_url
      }));

      renderizarListas();
      if(canciones.length > 0) cargarCancion(0);
    } catch (error) {
      console.error("Error de GitHub:", error);
    }
  }

  function crearElementoLista(cancion, index) {
    const li = document.createElement('li');
    li.className = `song-item ${index === currentTrackIndex ? 'playing' : ''}`;
    li.innerHTML = `
      <div class="song-cover"></div>
      <div class="song-info">
        <div class="song-title">${cancion.titulo}</div>
        <div class="song-artist">ONGAKU Lofi</div>
      </div>
    `;
    li.addEventListener('click', () => {
      cargarCancion(index);
      reproducir();
      fullPlayer.classList.add('active');
    });
    return li;
  }

  function renderizarListas() {
    listaCanciones.innerHTML = ''; listaTendencias.innerHTML = '';
    canciones.slice(0, 5).forEach((c, i) => listaTendencias.appendChild(crearElementoLista(c, i)));
    canciones.forEach((c, i) => listaCanciones.appendChild(crearElementoLista(c, i)));
  }

  // --- 4. REPRODUCTOR ---
  function cargarCancion(index) {
    if(canciones.length === 0) return;
    currentTrackIndex = index;
    const cancion = canciones[index];
    
    audio.src = cancion.src;
    miniTitle.textContent = cancion.titulo;
    fullTitle.textContent = cancion.titulo;

    document.querySelectorAll('.song-item').forEach((el) => {
      el.classList.toggle('playing', el.querySelector('.song-title').textContent === cancion.titulo);
    });

    actualizarMediaSession(cancion);
    actualizarCorazonUI();
  }

  function reproducir() {
    if (!audio.src && canciones.length > 0) cargarCancion(0);
    audio.play();
    isPlaying = true;
    actualizarBotonesPlay(true);
  }

  function pausar() {
    audio.pause();
    isPlaying = false;
    actualizarBotonesPlay(false);
  }

  function togglePlay() { isPlaying ? pausar() : reproducir(); }

  function actualizarBotonesPlay(playing) {
    const icon = playing ? '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>' : '<path d="M8 5v14l11-7z"/>';
    miniIconPlay.innerHTML = icon;
    iconPlayMain.innerHTML = icon;
  }

  // --- 5. FAVORITOS ---
  function actualizarCorazonUI() {
    if(canciones.length === 0) return;
    const cancionActual = canciones[currentTrackIndex].titulo;
    if(misFavoritos.includes(cancionActual)) btnHeartFull.classList.add('active');
    else btnHeartFull.classList.remove('active');
  }

  btnHeartFull.addEventListener('click', async () => {
    if(!usuarioActual || canciones.length === 0) return;
    const cancionActual = canciones[currentTrackIndex].titulo;
    const docRef = doc(_db, "estudiantes", usuarioActual.uid);

    if (misFavoritos.includes(cancionActual)) {
      await updateDoc(docRef, { favoritos: arrayRemove(cancionActual) });
      misFavoritos = misFavoritos.filter(c => c !== cancionActual);
    } else {
      await updateDoc(docRef, { favoritos: arrayUnion(cancionActual) });
      misFavoritos.push(cancionActual);
    }
    actualizarCorazonUI();
  });

  // --- 6. BOTONES ---
  btnMiniPlay.addEventListener('click', togglePlay);
  btnPlayMain.addEventListener('click', togglePlay);
  btnNext.addEventListener('click', () => { currentTrackIndex = (currentTrackIndex + 1) % canciones.length; cargarCancion(currentTrackIndex); if(isPlaying) reproducir(); });
  btnPrev.addEventListener('click', () => { currentTrackIndex = (currentTrackIndex - 1 + canciones.length) % canciones.length; cargarCancion(currentTrackIndex); if(isPlaying) reproducir(); });
  
  btnShuffle.addEventListener('click', () => { isShuffle = !isShuffle; btnShuffle.style.color = isShuffle ? 'var(--aguamarina)' : 'var(--texto-dim)'; });
  btnRepeat.addEventListener('click', () => { isRepeat = !isRepeat; btnRepeat.style.color = isRepeat ? 'var(--aguamarina)' : 'var(--texto-dim)'; });

  document.getElementById('mini-player').addEventListener('click', (e) => {
    if(!e.target.closest('button')) fullPlayer.classList.add('active');
  });
  btnCloseFull.addEventListener('click', () => fullPlayer.classList.remove('active'));

  audio.addEventListener('ended', () => {
    if(isRepeat) { audio.currentTime = 0; reproducir(); } 
    else { currentTrackIndex = (currentTrackIndex + 1) % canciones.length; cargarCancion(currentTrackIndex); reproducir(); }
  });

  audio.addEventListener('timeupdate', () => {
    const pct = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = `${pct || 0}%`;
    timeCurrent.textContent = formatearTiempo(audio.currentTime);
  });
  audio.addEventListener('loadedmetadata', () => timeTotal.textContent = formatearTiempo(audio.duration));

  function formatearTiempo(sec) {
    if (isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60); const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // --- 7. BÚSQUEDA Y FILTROS ---
  buscador.addEventListener('input', (e) => {
    const text = e.target.value.toLowerCase();
    listaBusqueda.innerHTML = '';
    if(text === '') return;
    canciones.filter(c => c.titulo.toLowerCase().includes(text)).forEach(c => {
      listaBusqueda.appendChild(crearElementoLista(c, canciones.findIndex(orig => orig.titulo === c.titulo)));
    });
  });

  document.getElementById('filtros-genero').addEventListener('click', (e) => {
    if(!e.target.classList.contains('pill')) return;
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    e.target.classList.add('active');
    
    const filtro = e.target.getAttribute('data-filter');
    listaFiltrada.innerHTML = '';
    if(filtro === 'todo') return;

    const resultados = canciones.filter(c => c.titulo.toLowerCase().includes(filtro));
    resultados.forEach(c => listaFiltrada.appendChild(crearElementoLista(c, canciones.findIndex(orig => orig.titulo === c.titulo))));
  });

  // --- 8. EFECTO 3D EN LA CARÁTULA ---
  fullCover.addEventListener('mousemove', (e) => {
    const rect = fullCover.getBoundingClientRect();
    const x = e.clientX - rect.left; const y = e.clientY - rect.top;
    const centerX = rect.width / 2; const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    fullCover.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  });
  fullCover.addEventListener('mouseleave', () => {
    fullCover.style.transform = `rotateX(0) rotateY(0) scale(1)`;
  });

  // --- 9. MODELO 3D ALEXANDER (Ruta: ./alexander.vrm) ---
  async function cargarAlexander3D() {
    const container = document.getElementById('vrm-container');
    if(!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
    camera.position.set(0, 1.2, 3);
    
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(150, 150);
    container.appendChild(renderer.domElement);

    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    
    const urlVrm = './alexander.vrm';

    loader.load(urlVrm, (gltf) => {
      const vrm = gltf.userData.vrm;
      VRMUtils.rotateVRM0(vrm);
      scene.add(vrm.scene);

      const light = new THREE.AmbientLight(0xffffff, 1.5);
      scene.add(light);

      const clock = new THREE.Clock();
      function animate() {
        requestAnimationFrame(animate);
        vrm.update(clock.getDelta());
        vrm.scene.position.y = Math.sin(clock.elapsedTime) * 0.05;
        renderer.render(scene, camera);
      }
      animate();
    }, undefined, (error) => {
      console.error("Error al cargar a Alexander:", error);
      container.innerHTML = '<p style="color:var(--aguamarina); font-size:0.8rem; text-align:center;">Cargando...</p>';
    });
  }

  // --- INICIALIZAR ---
  cargarMusicaDesdeGitHub();
  cargarAlexander3D();
});

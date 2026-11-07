// --- LÓGICA ONGAKU - FASE 2 ---

document.addEventListener('DOMContentLoaded', () => {
  
  // --- 1. CONFIGURACIÓN GITHUB ---
  const GITHUB_USER = "papiromesa-ux";
  const GITHUB_REPO = "-ONGAKU-";
  const GITHUB_BRANCH = "main";
  const CARPETA_MUSICA = "musicas/fondo";

  let canciones = [];
  let currentTrackIndex = 0;
  let isPlaying = false;
  let isShuffle = false;
  let isRepeat = false;

  // Elementos DOM
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

  // --- 2. SALUDO DINÁMICO (Punto 11) ---
  function actualizarSaludo() {
    const hora = new Date().getHours();
    const genero = localStorage.getItem('mizushi_genero') || 'hombre'; // Simulamos que Firebase nos dio esto
    let saludo = "";
    const esFemenino = genero.toLowerCase() === 'mujer' || genero.toLowerCase() === 'femenino';

    if (hora >= 1 && hora < 7) {
      saludo = esFemenino ? "Hola, Madrugadora" : "Hola, Madrugador";
    } else if (hora >= 7 && hora < 13) {
      saludo = "Buenos días";
    } else if (hora >= 13 && hora < 19) {
      saludo = "Buen provecho";
    } else if (hora >= 19 && hora < 22) {
      saludo = "Buenas noches";
    } else {
      saludo = esFemenino ? "Hola, Noctámbura" : "Hola, Noctámbulo";
    }
    
    document.getElementById('dynamic-greeting').textContent = saludo;
  }

  // --- 3. SONIDOS ASMR (Punto 13) ---
  const sonidoClick = new Audio('assets/sonidos/click.mp3'); // Asegúrate de tener este archivo
  document.querySelectorAll('.btn-sonido').forEach(btn => {
    btn.addEventListener('click', () => {
      sonidoClick.currentTime = 0;
      sonidoClick.volume = 0.4;
      sonidoClick.play().catch(e => console.log("Audio no encontrado"));
    });
  });

  // --- 4. CARGAR MÚSICA DESDE GITHUB (Punto 1: Traer todas) ---
  async function cargarMusicaDesdeGitHub() {
    try {
      // Agregamos ?per_page=100 para traer todas las canciones
      const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${CARPETA_MUSICA}?ref=${GITHUB_BRANCH}&per_page=100`;
      const res = await fetch(url);
      const archivos = await res.json();

      canciones = archivos
        .filter(a => a.name.endsWith('.mp3'))
        .map(a => ({
          titulo: a.name.replace('.mp3', '').replace(/_/g, ' '),
          src: a.download_url
        }));

      renderizarListas();
      if(canciones.length > 0) cargarCancion(0);
    } catch (error) {
      console.error("Error al conectar con GitHub:", error);
    }
  }

  // --- 5. RENDERIZAR LISTAS ---
  function crearElementoLista(cancion, index) {
    const li = document.createElement('li');
    li.className = `song-item ${index === currentTrackIndex ? 'playing' : ''}`;
    li.innerHTML = `
      <div class="song-cover">MP3</div>
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
    listaCanciones.innerHTML = '';
    listaTendencias.innerHTML = '';
    listaFiltrada.innerHTML = '';
    
    canciones.slice(0, 5).forEach((c, i) => listaTendencias.appendChild(crearElementoLista(c, i)));
    canciones.forEach((c, i) => listaCanciones.appendChild(crearElementoLista(c, i)));
  }

  // --- 6. FILTROS DE GÉNERO (Punto 3) ---
  document.getElementById('filtros-genero').addEventListener('click', (e) => {
    if(!e.target.classList.contains('pill')) return;
    
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    e.target.classList.add('active');
    
    const filtro = e.target.getAttribute('data-filter');
    listaFiltrada.innerHTML = '';

    if(filtro === 'todo') {
      listaFiltrada.innerHTML = '<p style="color:#aaa;">Todos los géneros seleccionados. Ve a Biblioteca para ver todo.</p>';
      return;
    }

    const resultados = canciones.filter(c => c.titulo.toLowerCase().includes(filtro));
    
    if(resultados.length === 0) {
      listaFiltrada.innerHTML = '<p style="color:#aaa;">No hay canciones en este género.</p>';
    } else {
      resultados.forEach(c => {
        const idxReal = canciones.findIndex(orig => orig.titulo === c.titulo);
        listaFiltrada.appendChild(crearElementoLista(c, idxReal));
      });
    }
  });

  // --- 7. LÓGICA DEL REPRODUCTOR (Puntos 6, 8, 9) ---
  function cargarCancion(index) {
    if(canciones.length === 0) return;
    currentTrackIndex = index;
    const cancion = canciones[index];
    
    audio.src = cancion.src;
    miniTitle.textContent = cancion.titulo;
    fullTitle.textContent = cancion.titulo;

    // Actualizar UI listas
    document.querySelectorAll('.song-item').forEach((el, i) => {
      el.classList.toggle('playing', el.querySelector('.song-title').textContent === cancion.titulo);
    });

    actualizarMediaSession(cancion);
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

  function siguienteCancion() {
    if(isShuffle) {
      currentTrackIndex = Math.floor(Math.random() * canciones.length);
    } else {
      currentTrackIndex = (currentTrackIndex + 1) % canciones.length;
    }
    cargarCancion(currentTrackIndex);
    if(isPlaying) reproducir();
  }

  function anteriorCancion() {
    currentTrackIndex = (currentTrackIndex - 1 + canciones.length) % canciones.length;
    cargarCancion(currentTrackIndex);
    if(isPlaying) reproducir();
  }

  // --- 8. EVENTOS ---
  btnMiniPlay.addEventListener('click', togglePlay);
  btnPlayMain.addEventListener('click', togglePlay);
  btnNext.addEventListener('click', siguienteCancion);
  btnPrev.addEventListener('click', anteriorCancion);
  
  btnShuffle.addEventListener('click', () => { isShuffle = !isShuffle; btnShuffle.style.color = isShuffle ? 'var(--aguamarina)' : 'var(--texto-dim)'; });
  btnRepeat.addEventListener('click', () => { isRepeat = !isRepeat; btnRepeat.style.color = isRepeat ? 'var(--aguamarina)' : 'var(--texto-dim)'; });
  
  btnHeartFull.addEventListener('click', () => {
    btnHeartFull.classList.toggle('active');
    // Aquí iría la lógica de Firebase (Punto 9)
  });

  document.getElementById('mini-player').addEventListener('click', (e) => {
    if(!e.target.closest('button')) fullPlayer.classList.add('active');
  });
  
  btnCloseFull.addEventListener('click', () => fullPlayer.classList.remove('active'));

  audio.addEventListener('ended', () => {
    if(isRepeat) { audio.currentTime = 0; reproducir(); } 
    else { siguienteCancion(); }
  });

  audio.addEventListener('timeupdate', () => {
    const pct = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = `${pct || 0}%`;
    timeCurrent.textContent = formatearTiempo(audio.currentTime);
  });

  audio.addEventListener('loadedmetadata', () => timeTotal.textContent = formatearTiempo(audio.duration));

  function formatearTiempo(sec) {
    if (isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // --- 9. BÚSQUEDA ---
  buscador.addEventListener('input', (e) => {
    const text = e.target.value.toLowerCase();
    listaBusqueda.innerHTML = '';
    if(text === '') return;
    canciones.filter(c => c.titulo.toLowerCase().includes(text)).forEach(c => {
      const idxReal = canciones.findIndex(orig => orig.titulo === c.titulo);
      listaBusqueda.appendChild(crearElementoLista(c, idxReal));
    });
  });

  // --- 10. MEDIA SESSION ---
  function actualizarMediaSession(cancion) {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: cancion.titulo,
        artist: "ONGAKU Lofi",
        album: 'MizushiKode',
        artwork: [{ src: 'https://papiromesa-ux.github.io/-MIZUSHIKODE-/assets/img/icon-musica-512.png', sizes: '512x512', type: 'image/png' }]
      });
      navigator.mediaSession.setActionHandler('play', reproducir);
      navigator.mediaSession.setActionHandler('pause', pausar);
      navigator.mediaSession.setActionHandler('previoustrack', anteriorCancion);
      navigator.mediaSession.setActionHandler('nexttrack', siguienteCancion);
    }
  }

  // INICIALIZAR
  actualizarSaludo();
  cargarMusicaDesdeGitHub();
});

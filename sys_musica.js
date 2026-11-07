document.addEventListener('DOMContentLoaded', () => {
  // --- CONFIGURACIÓN DE GITHUB ---
  const GITHUB_USER = "papiromesa-ux";
  const GITHUB_REPO = "-ONGAKU-";
  const GITHUB_BRANCH = "main";
  const CARPETA_MUSICA = "musicas/fondo";

  let canciones = [];
  let currentTrackIndex = 0;
  let isPlaying = false;

  // Elementos del DOM
  const audio = document.getElementById('audio-player');
  const listaCanciones = document.getElementById('lista-canciones');
  const listaTendencias = document.getElementById('lista-tendencias');
  const listaBusqueda = document.getElementById('lista-busqueda');
  const buscador = document.getElementById('buscador');
  
  const miniPlayer = document.getElementById('mini-player');
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

  const settingsScreen = document.getElementById('settings-screen');
  const btnOpenSettings = document.getElementById('btn-open-settings');
  const btnCloseSettings = document.getElementById('btn-close-settings');

  // --- 1. LÓGICA DE PESTAÑAS ---
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      
      e.currentTarget.classList.add('active');
      const tabId = e.currentTarget.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });

  // --- 2. CONEXIÓN CON GITHUB (LA NUBE) ---
  async function cargarMusicaDesdeGitHub() {
    try {
      const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${CARPETA_MUSICA}?ref=${GITHUB_BRANCH}`;
      const res = await fetch(url);
      const archivos = await res.json();

      canciones = archivos
        .filter(a => a.name.endsWith('.mp3'))
        .map(a => ({
          titulo: a.name.replace('.mp3', '').replace(/_/g, ' '), // Limpia el nombre
          src: a.download_url
        }));

      renderizarListas();
      if(canciones.length > 0) cargarCancion(0);

    } catch (error) {
      console.error("Error al conectar con GitHub:", error);
      listaCanciones.innerHTML = '<p style="color: var(--magenta); text-align: center;">Error al cargar la música desde la nube.</p>';
    }
  }

  function renderizarListas() {
    listaCanciones.innerHTML = '';
    listaTendencias.innerHTML = '';
    
    // Solo mostramos las primeras 5 en tendencias para no saturar
    canciones.slice(0, 5).forEach((cancion, index) => {
      listaTendencias.appendChild(crearElementoLista(cancion, index));
    });

    // Todas las canciones en la biblioteca
    canciones.forEach((cancion, index) => {
      listaCanciones.appendChild(crearElementoLista(cancion, index));
    });
  }

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
      fullPlayer.classList.add('active'); // Abre pantalla completa
    });
    return li;
  }

  // --- 3. LÓGICA DEL REPRODUCTOR ---
  function cargarCancion(index) {
    if(canciones.length === 0) return;
    currentTrackIndex = index;
    const cancion = canciones[index];
    
    audio.src = cancion.src;
    miniTitle.textContent = cancion.titulo;
    fullTitle.textContent = cancion.titulo;

    // Actualizar UI de la lista
    document.querySelectorAll('.song-item').forEach((el, i) => {
      if (i === index % canciones.length || el.querySelector('.song-title').textContent === cancion.titulo) {
        el.classList.add('playing');
      } else {
        el.classList.remove('playing');
      }
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

  function togglePlay() {
    if (isPlaying) pausar();
    else reproducir();
  }

  function actualizarBotonesPlay(playing) {
    const icon = playing ? '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>' : '<path d="M8 5v14l11-7z"/>';
    miniIconPlay.innerHTML = icon;
    iconPlayMain.innerHTML = icon;
  }

  // --- 4. EVENTOS DE AUDIO Y UI ---
  btnMiniPlay.addEventListener('click', togglePlay);
  btnPlayMain.addEventListener('click', togglePlay);
  miniPlayer.addEventListener('click', (e) => {
    if(!e.target.closest('button')) fullPlayer.classList.add('active');
  });
  btnCloseFull.addEventListener('click', () => fullPlayer.classList.remove('active'));
  
  btnOpenSettings.addEventListener('click', () => settingsScreen.classList.add('active'));
  btnCloseSettings.addEventListener('click', () => settingsScreen.classList.remove('active'));

  audio.addEventListener('ended', () => {
    currentTrackIndex = (currentTrackIndex + 1) % canciones.length;
    cargarCancion(currentTrackIndex);
    reproducir();
  });

  audio.addEventListener('timeupdate', () => {
    const pct = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = `${pct || 0}%`;
    timeCurrent.textContent = formatearTiempo(audio.currentTime);
  });

  audio.addEventListener('loadedmetadata', () => {
    timeTotal.textContent = formatearTiempo(audio.duration);
  });

  function formatearTiempo(sec) {
    if (isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // --- 5. BÚSQUEDA ---
  buscador.addEventListener('input', (e) => {
    const text = e.target.value.toLowerCase();
    listaBusqueda.innerHTML = '';
    if(text === '') return;

    const resultados = canciones.filter(c => c.titulo.toLowerCase().includes(text));
    resultados.forEach(cancion => {
      const indexReal = canciones.findIndex(c => c.titulo === cancion.titulo);
      listaBusqueda.appendChild(crearElementoLista(cancion, indexReal));
    });
  });

  // --- 6. NOTIFICACIÓN ANDROID (MediaSession) ---
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
    }
  }

  // INICIAR
  cargarMusicaDesdeGitHub();
});

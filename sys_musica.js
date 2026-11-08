// 1. OCULTAR PANTALLA DE CARGA RÁPIDO
setTimeout(() => {
  const ls = document.getElementById('loading-screen');
  if(ls) ls.classList.add('hidden');
}, 600);

document.addEventListener('DOMContentLoaded', () => {
  
  // --- CONFIGURACIÓN Y VARIABLES ---
  const GITHUB_USER = "papiromesa-ux";
  const GITHUB_REPO = "-ONGAKU-";
  const GITHUB_BRANCH = "main";
  const CARPETA_MUSICA = "musicas/fondo";

  let canciones = [];
  let currentTrackIndex = 0;
  let isPlaying = false;
  let usuarioActual = null;

  const audio = document.getElementById('audio-player');

  // --- 2. CONECTAR BOTONES (PRIORIDAD 1 - A PRUEBA DE FALLOS) ---
  const btnPlayMain = document.getElementById('btn-play-main');
  const btnMiniPlay = document.getElementById('mini-play');
  const iconPlayMain = document.getElementById('icon-play-main');
  const miniIconPlay = document.getElementById('mini-icon-play');
  const btnNext = document.getElementById('btn-next');
  const btnPrev = document.getElementById('btn-prev');
  const btnCloseFull = document.getElementById('btn-close-full');
  const miniPlayer = document.getElementById('mini-player');
  const fullPlayer = document.getElementById('full-player');
  const btnDownload = document.getElementById('btn-download');

  // Sonidos ASMR
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

  // Funciones Reproductor
  function reproducir() { 
    audio.play().then(() => { 
      isPlaying = true; 
      iconPlayMain.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>'; 
      miniIconPlay.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>'; 
    }).catch(e => console.log("Bloqueado")); 
  }

  function pausar() { 
    audio.pause(); 
    isPlaying = false; 
    iconPlayMain.innerHTML = '<path d="M8 5v14l11-7z"/>'; 
    miniIconPlay.innerHTML = '<path d="M8 5v14l11-7z"/>'; 
  }

  function togglePlay() { if(isPlaying) pausar(); else reproducir(); }

  btnPlayMain.onclick = togglePlay;
  btnMiniPlay.onclick = togglePlay;
  
  btnNext.onclick = () => { if(canciones.length) { currentTrackIndex = (currentTrackIndex + 1) % canciones.length; cargarCancion(currentTrackIndex); if(isPlaying) reproducir(); } };
  btnPrev.onclick = () => { if(canciones.length) { currentTrackIndex = (currentTrackIndex - 1 + canciones.length) % canciones.length; cargarCancion(currentTrackIndex); if(isPlaying) reproducir(); } };
  
  btnCloseFull.onclick = () => fullPlayer.classList.remove('active');
  miniPlayer.onclick = (e) => { if(!e.target.closest('button')) fullPlayer.classList.add('active'); };

  btnDownload.onclick = () => {
    if(canciones.length) {
      const link = document.createElement('a');
      link.href = canciones[currentTrackIndex].src;
      link.download = canciones[currentTrackIndex].titulo + ".mp3";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // --- 3. SALUDO ---
  function actualizarSaludo(genero = 'hombre') {
    const hora = new Date().getHours();
    const esFemenino = genero.toLowerCase() === 'mujer' || genero.toLowerCase() === 'femenino';
    let saludo = "";
    if (hora >= 1 && hora < 7) saludo = esFemenino ? "HOLA, MADRUGADORA" : "HOLA, MADRUGADOR";
    else if (hora >= 7 && hora < 13) saludo = "BUENOS DÍAS";
    else if (hora >= 13 && hora < 19) saludo = "BUEN PROVECHO";
    else if (hora >= 19 && hora < 22) saludo = "BUENAS NOCHES";
    else saludo = esFemenino ? "HOLA, NOCTÁMBURA" : "HOLA, NOCTÁMBULO";
    const el = document.getElementById('dynamic-greeting');
    if(el) el.textContent = saludo;
  }
  actualizarSaludo(); 

  // --- 4. CARGAR CANCIONES ---
  async function cargarMusicaDesdeGitHub() {
    try {
      const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${CARPETA_MUSICA}?ref=${GITHUB_BRANCH}&per_page=100`;
      const res = await fetch(url);
      const archivos = await res.json();

      canciones = archivos.filter(a => a.name.endsWith('.mp3')).map(a => ({
        titulo: a.name.replace('.mp3', '').replace(/_/g, ' ').toUpperCase(),
        src: a.download_url
      }));

      const listaCanciones = document.getElementById('lista-canciones');
      const listaTendencias = document.getElementById('lista-tendencias');
      listaCanciones.innerHTML = ''; listaTendencias.innerHTML = '';
      
      canciones.slice(0, 5).forEach((c, i) => listaTendencias.appendChild(crearItem(c, i)));
      canciones.forEach((c, i) => listaCanciones.appendChild(crearItem(c, i)));

      if(canciones.length > 0) cargarCancion(0);

      // Una vez cargada la música, disparamos lo demás en segundo plano
      cargarFirebase();
      cargarModelos3D();

    } catch (error) {
      console.error("Error de GitHub:", error);
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

  function cargarCancion(index) {
    if(!canciones[index]) return;
    currentTrackIndex = index;
    audio.src = canciones[index].src;
    document.getElementById('mini-title').textContent = canciones[index].titulo;
    document.getElementById('full-title').textContent = canciones[index].titulo;
  }

  // Eventos de audio
  audio.ontimeupdate = () => {
    const pct = (audio.currentTime / audio.duration) * 100;
    document.getElementById('progress-fill').style.width = `${pct || 0}%`;
    document.getElementById('time-current').textContent = isNaN(audio.currentTime) ? "0:00" : `${Math.floor(audio.currentTime/60)}:${Math.floor(audio.currentTime%60).toString().padStart(2,'0')}`;
  };
  audio.onloadedmetadata = () => {
    document.getElementById('time-total').textContent = isNaN(audio.duration) ? "0:00" : `${Math.floor(audio.duration/60)}:${Math.floor(audio.duration%60).toString().padStart(2,'0')}`;
  };

  // --- 5. FIREBASE (EN SEGUNDO PLANO) ---
  async function cargarFirebase() {
    try {
      const { _db, _secAuth } = await import("./firebase.js");
      const { onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js");
      const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js");

      onAuthStateChanged(_secAuth, async (user) => {
        if (user) {
          usuarioActual = user;
          const docRef = doc(_db, "estudiantes", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            actualizarSaludo(data.genero);
          }
        }
      });
    } catch(e) { console.log("Modo offline: Firebase no cargado."); }
  }

  // --- 6. MODELOS 3D (EN SEGUNDO PLANO) ---
  async function cargarModelos3D() {
    try {
      const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
      const { GLTFLoader } = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js');
      const { VRMLoaderPlugin, VRMUtils } = await import('https://cdn.jsdelivr.net/npm/@pixiv/three-vrm@3.0.0/lib/three-vrm.module.js');

      // Audífonos
      const containerAudifonos = document.getElementById('canvas-loading');
      if(containerAudifonos) {
        containerAudifonos.innerHTML = ''; // Quitamos el fallback
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.set(0, 0, 5);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(200, 200);
        containerAudifonos.appendChild(renderer.domElement);
        scene.add(new THREE.AmbientLight(0xffffff, 1.5));
        
        new GLTFLoader().load('./audifonos.glb', (gltf) => {
          const m = gltf.scene; scene.add(m);
          (function animate() { requestAnimationFrame(animate); m.rotation.y += 0.02; renderer.render(scene, camera); })();
        }, undefined, () => { containerAudifonos.innerHTML = '<div class="fallback-audifonos">🎧</div>'; });
      }

      // Alexander
      const containerVrm = document.getElementById('vrm-container');
      if(containerVrm) {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
        camera.position.set(0, 1.2, 3);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(150, 150);
        containerVrm.appendChild(renderer.domElement);
        const loader = new GLTFLoader();
        loader.register((parser) => new VRMLoaderPlugin(parser));
        
        loader.load('./alexander.vrm', (gltf) => {
          const vrm = gltf.userData.vrm; VRMUtils.rotateVRM0(vrm); scene.add(vrm.scene);
          scene.add(new THREE.AmbientLight(0xffffff, 1.5));
          const clock = new THREE.Clock();
          (function animate() { requestAnimationFrame(animate); vrm.update(clock.getDelta()); vrm.scene.position.y = Math.sin(clock.elapsedTime) * 0.05; renderer.render(scene, camera); })();
        }, undefined, () => console.log("Alexander no disponible"));
      }
    } catch (error) { console.log("3D no cargados"); }
  }

  // --- 7. INICIAR ---
  cargarMusicaDesdeGitHub(); 
});

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

  const audio = document.getElementById('audio-player');
  const loadingScreen = document.getElementById('loading-screen');

  // --- 1. SONIDOS CLICK ---
  const sonidos = [
    new Audio('resources/audio/click1.mp3'),
    new Audio('resources/audio/click2.mp3'),
    new Audio('resources/audio/click3.mp3')
  ];
  document.querySelectorAll('.btn-sonido').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = sonidos[Math.floor(Math.random() * sonidos.length)];
      if(s) { s.currentTime = 0; s.volume = 0.3; s.play().catch(e => {}); }
    });
  });

  // --- 2. SALUDO ---
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
  actualizarSaludo(); // Quita el "Cargando..." inmediatamente

  // --- 3. FIREBASE (Sin bloquear ni expulsar) ---
  try {
    onAuthStateChanged(_secAuth, async (user) => {
      if (user) {
        usuarioActual = user;
        const docRef = doc(_db, "estudiantes", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          misFavoritos = data.favoritos || [];
          actualizarSaludo(data.genero);
        }
      }
      // Si no hay usuario, NO HACEMOS NADA. Lo dejamos escuchar como invitado.
    });
  } catch(e) { console.log("Firebase no cargó."); }

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

      const listaCanciones = document.getElementById('lista-canciones');
      const listaTendencias = document.getElementById('lista-tendencias');
      listaCanciones.innerHTML = ''; listaTendencias.innerHTML = '';
      
      canciones.slice(0, 5).forEach((c, i) => listaTendencias.appendChild(crearItem(c, i)));
      canciones.forEach((c, i) => listaCanciones.appendChild(crearItem(c, i)));

      if(canciones.length > 0) cargarCancion(0);
      if(loadingScreen) loadingScreen.classList.add('hidden');

      document.dispatchEvent(new Event('ongakuReady')); // Avisa a los 3D

    } catch (error) {
      console.error("Error de GitHub:", error);
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
    li.onclick = () => { cargarCancion(index); reproducir(); document.getElementById('full-player').classList.add('active'); };
    return li;
  }

  // --- 5. REPRODUCTOR ---
  function cargarCancion(index) {
    if(!canciones[index]) return;
    currentTrackIndex = index;
    audio.src = canciones[index].src;
    document.getElementById('mini-title').textContent = canciones[index].titulo;
    document.getElementById('full-title').textContent = canciones[index].titulo;
  }

  function reproducir() { 
    audio.play().then(() => { 
      isPlaying = true; 
      document.getElementById('mini-icon-play').innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>'; 
      document.getElementById('icon-play-main').innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>'; 
    }).catch(e => console.log("Bloqueado")); 
  }

  function pausar() { 
    audio.pause(); 
    isPlaying = false; 
    document.getElementById('mini-icon-play').innerHTML = '<path d="M8 5v14l11-7z"/>'; 
    document.getElementById('icon-play-main').innerHTML = '<path d="M8 5v14l11-7z"/>'; 
  }

  document.getElementById('mini-play').onclick = () => isPlaying ? pausar() : reproducir();
  document.getElementById('btn-play-main').onclick = () => isPlaying ? pausar() : reproducir();
  document.getElementById('btn-next').onclick = () => { if(canciones.length) { currentTrackIndex = (currentTrackIndex + 1) % canciones.length; cargarCancion(currentTrackIndex); if(isPlaying) reproducir(); } };
  document.getElementById('btn-prev').onclick = () => { if(canciones.length) { currentTrackIndex = (currentTrackIndex - 1 + canciones.length) % canciones.length; cargarCancion(currentTrackIndex); if(isPlaying) reproducir(); } };
  document.getElementById('btn-close-full').onclick = () => document.getElementById('full-player').classList.remove('active');
  document.getElementById('mini-player').onclick = (e) => { if(!e.target.closest('button')) document.getElementById('full-player').classList.add('active'); };

  audio.ontimeupdate = () => {
    const pct = (audio.currentTime / audio.duration) * 100;
    document.getElementById('progress-fill').style.width = `${pct || 0}%`;
    document.getElementById('time-current').textContent = isNaN(audio.currentTime) ? "0:00" : `${Math.floor(audio.currentTime/60)}:${Math.floor(audio.currentTime%60).toString().padStart(2,'0')}`;
  };
  audio.onloadedmetadata = () => {
    document.getElementById('time-total').textContent = isNaN(audio.duration) ? "0:00" : `${Math.floor(audio.duration/60)}:${Math.floor(audio.duration%60).toString().padStart(2,'0')}`;
  };

  // --- INICIAR ---
  cargarMusicaDesdeGitHub();
});

// --- 6. CARGAR MODELOS 3D (Separado) ---
document.addEventListener('ongakuReady', async () => {
  try {
    const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
    const { GLTFLoader } = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js');
    const { VRMLoaderPlugin, VRMUtils } = await import('https://cdn.jsdelivr.net/npm/@pixiv/three-vrm@3.0.0/lib/three-vrm.module.js');

    const containerAudifonos = document.getElementById('canvas-loading');
    if(containerAudifonos) {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(0, 0, 5);
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(250, 250);
      containerAudifonos.appendChild(renderer.domElement);
      scene.add(new THREE.AmbientLight(0xffffff, 1.5));
      const dir = new THREE.DirectionalLight(0x00f5d4, 2); dir.position.set(5, 5, 5); scene.add(dir);
      
      new GLTFLoader().load('./audifonos.glb', (gltf) => {
        const m = gltf.scene; scene.add(m);
        (function animate() { requestAnimationFrame(animate); m.rotation.y += 0.01; renderer.render(scene, camera); })();
      }, undefined, (e) => console.log("Error audífonos"));
    }

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
      }, undefined, (e) => console.log("Error Alexander"));
    }
  } catch (error) { console.log("Modelos 3D fallaron, pero la app funciona."); }
});

import { _db, _secAuth } from "../firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  const listaFavoritos = document.getElementById('lista-favoritos');
  const mensajeVacio = document.getElementById('mensaje-vacio');
  const audio = document.getElementById('audio-player');
  const miniTitle = document.getElementById('mini-title');
  const miniCover = document.getElementById('mini-cover');

  // 1. Esperar a que la "boda" (Auth) nos diga quién es el usuario
  onAuthStateChanged(_secAuth, async (user) => {
    if (user) {
      // 2. Si hay usuario, buscar sus favoritos en Firestore
      try {
        const docRef = doc(_db, "estudiantes", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const favoritosGuardados = data.favoritos || [];

          if (favoritosGuardados.length === 0) {
            mostrarVacio();
          } else {
            cargarCancionesFavoritas(favoritosGuardados);
          }
        } else {
          mostrarVacio();
        }
      } catch (error) {
        console.error("Error al leer Firestore:", error);
        mostrarVacio();
      }
    }
  });

  function mostrarVacio() {
    listaFavoritos.style.display = 'none';
    mensajeVacio.style.display = 'flex';
  }

  // 3. Buscar los MP3 en GitHub y filtrar solo los que están en favoritos
  async function cargarCancionesFavoritas(favoritos) {
    try {
      const url = `https://api.github.com/repos/papiromesa-ux/-ONGAKU-/contents/musicas/fondo?ref=main&per_page=100`;
      const res = await fetch(url);
      const archivos = await res.json();

      // Formatear todas las canciones
      const todasLasCanciones = archivos.filter(a => a.name.endsWith('.mp3')).map(a => ({
        titulo: a.name.replace('.mp3', '').replace(/_/g, ' ').toUpperCase(),
        src: a.download_url
      }));

      // Cruzar los favoritos del usuario con las canciones reales
      const cancionesAMostrar = todasLasCanciones.filter(c => favoritos.includes(c.titulo));

      if (cancionesAMostrar.length === 0) {
        mostrarVacio();
        return;
      }

      // Renderizar
      listaFavoritos.innerHTML = '';
      cancionesAMostrar.forEach(cancion => {
        const li = document.createElement('li');
        li.className = 'song-item';
        li.innerHTML = `
          <div class="song-cover" style="background-image: url('../img/japon1.jpg')"></div>
          <div class="song-info">
            <div class="song-title">${cancion.titulo}</div>
            <div class="song-artist">ONGAKU Lofi</div>
          </div>
        `;
        li.onclick = () => {
          audio.src = cancion.src;
          miniTitle.textContent = cancion.titulo;
          miniCover.style.backgroundImage = "url('../img/japon1.jpg')";
          audio.play();
          localStorage.setItem('ongaku_isPlaying', 'true');
          document.getElementById('mini-icon-play').innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
        };
        listaFavoritos.appendChild(li);
      });

    } catch (e) {
      console.log("Error al cargar favoritos", e);
    }
  }
});

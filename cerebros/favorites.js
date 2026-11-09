import { _db, _secAuth } from "../firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  const listaFavoritos = document.getElementById('lista-favoritos');
  const mensajeVacio = document.getElementById('mensaje-vacio');

  // Leer qué canción está sonando actualmente en el reproductor global
  const cancionSonando = localStorage.getItem('ongaku_title');
  const srcSonando = localStorage.getItem('ongaku_src');

  onAuthStateChanged(_secAuth, async (user) => {
    if (user) {
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

  async function cargarCancionesFavoritas(favoritos) {
    try {
      const url = `https://api.github.com/repos/papiromesa-ux/-ONGAKU-/contents/musicas/fondo?ref=main&per_page=100`;
      const res = await fetch(url);
      const archivos = await res.json();

      const todasLasCanciones = archivos.filter(a => a.name.endsWith('.mp3')).map(a => ({
        titulo: a.name.replace('.mp3', '').replace(/_/g, ' ').toUpperCase(),
        src: a.download_url
      }));

      const cancionesAMostrar = todasLasCanciones.filter(c => favoritos.includes(c.titulo));

      if (cancionesAMostrar.length === 0) {
        mostrarVacio();
        return;
      }

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
          // En lugar de reproducir directamente, disparamos el evento
          document.dispatchEvent(new CustomEvent('play-song', { 
            detail: { titulo: cancion.titulo, src: cancion.src } 
          }));
        };
        listaFavoritos.appendChild(li);
      });

    } catch (e) {
      console.log("Error al cargar favoritos", e);
    }
  }
});

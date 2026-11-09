// cerebros/index.js
import { iniciarBoda } from "./auth.js";

document.addEventListener('DOMContentLoaded', () => {
  // 1. Iniciar la boda (Verificar si está logueado)
  iniciarBoda();

  // 2. Cargar Tendencias
  async function cargarTendencias() {
    try {
      const url = `https://api.github.com/repos/papiromesa-ux/-ONGAKU-/contents/musicas/fondo?ref=main&per_page=100`;
      const res = await fetch(url);
      const archivos = await res.json();

      const canciones = archivos.filter(a => a.name.endsWith('.mp3')).map(a => ({
        titulo: a.name.replace('.mp3', '').replace(/_/g, ' ').toUpperCase(),
        src: a.download_url
      })).slice(0, 5);

      const lista = document.getElementById('lista-tendencias');
      lista.innerHTML = '';
      
      canciones.forEach(cancion => {
        const li = document.createElement('li');
        li.className = 'song-item';
        li.innerHTML = `
          <div class="song-cover" style="background-image: url('img/japon1.jpg')"></div>
          <div class="song-info">
            <div class="song-title">${cancion.titulo}</div>
            <div class="song-artist">ONGAKU Lofi</div>
          </div>
        `;
        li.onclick = () => {
          const audio = document.getElementById('audio-player');
          audio.src = cancion.src;
          document.getElementById('mini-title').textContent = cancion.titulo;
          document.getElementById('mini-cover').style.backgroundImage = "url('img/japon1.jpg')";
          audio.play();
          localStorage.setItem('ongaku_isPlaying', 'true');
          document.getElementById('mini-icon-play').innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
        };
        lista.appendChild(li);
      });
    } catch (e) { console.log("Error al cargar tendencias"); }
  }
  cargarTendencias();
});

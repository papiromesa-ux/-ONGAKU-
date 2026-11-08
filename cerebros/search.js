document.addEventListener('DOMContentLoaded', () => {
  const inputBusqueda = document.getElementById('input-busqueda');
  const listaResultados = document.getElementById('resultados-busqueda');
  const audio = document.getElementById('audio-player');
  const miniTitle = document.getElementById('mini-title');
  const miniCover = document.getElementById('mini-cover');

  let todasLasCanciones = [];

  // Cargar todas las canciones de GitHub
  async function cargarCanciones() {
    try {
      const url = `https://api.github.com/repos/papiromesa-ux/-ONGAKU-/contents/musicas/fondo?ref=main&per_page=100`;
      const res = await fetch(url);
      const archivos = await res.json();

      todasLasCanciones = archivos.filter(a => a.name.endsWith('.mp3')).map(a => ({
        titulo: a.name.replace('.mp3', '').replace(/_/g, ' ').toUpperCase(),
        src: a.download_url
      }));
    } catch (e) {
      console.log("Error al cargar canciones");
    }
  }
  cargarCanciones();

  // Función de búsqueda
  inputBusqueda.addEventListener('input', (e) => {
    const texto = e.target.value.toLowerCase();
    listaResultados.innerHTML = '';

    if (texto.length === 0) return; // Si no hay texto, no mostrar nada

    const filtradas = todasLasCanciones.filter(c => c.titulo.toLowerCase().includes(texto));

    if (filtradas.length === 0) {
      listaResultados.innerHTML = '<p style="color: var(--texto-dim); text-align: center; margin-top: 2rem;">No se encontraron canciones.</p>';
      return;
    }

    filtradas.forEach(cancion => {
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
      listaResultados.appendChild(li);
    });
  });
});

document.addEventListener('DOMContentLoaded', () => {
  // 1. Saludo
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

  // 2. Cargar Tendencias (Solo 5 canciones)
  async function cargarTendencias() {
    try {
      const url = `https://api.github.com/repos/papiromesa-ux/-ONGAKU-/contents/musicas/fondo?ref=main&per_page=100`;
      const res = await fetch(url);
      const archivos = await res.json();

      const canciones = archivos.filter(a => a.name.endsWith('.mp3')).map(a => ({
        titulo: a.name.replace('.mp3', '').replace(/_/g, ' ').toUpperCase(),
        src: a.download_url
      })).slice(0, 5); // Solo mostramos las 5 primeras

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
          // Actualizamos el reproductor global
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

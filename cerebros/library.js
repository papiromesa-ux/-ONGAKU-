document.addEventListener('DOMContentLoaded', () => {
  const contenedor = document.getElementById('contenedor-generos');
  const audio = document.getElementById('audio-player');
  const miniTitle = document.getElementById('mini-title');
  const miniCover = document.getElementById('mini-cover');

  // Definimos los géneros y las palabras clave para identificarlos en el nombre del archivo
  const generos = [
    { nombre: "ROCK", clave: ["rock"] },
    { nombre: "ELECTRÓNICA", clave: ["electronica", "electronico"] },
    { nombre: "INSTRUMENTAL", clave: ["instrumental", "basico"] },
    { nombre: "JAZZ / PIANO", clave: ["jazz", "piano"] },
    { nombre: "POR DESCUBRIR", clave: [] } // Aquí caen las que no coincidan
  ];

  async function cargarBiblioteca() {
    try {
      const url = `https://api.github.com/repos/papiromesa-ux/-ONGAKU-/contents/musicas/fondo?ref=main&per_page=100`;
      const res = await fetch(url);
      const archivos = await res.json();

      // Formateamos las canciones
      const canciones = archivos.filter(a => a.name.endsWith('.mp3')).map(a => {
        const nombreLimpio = a.name.replace('.mp3', '').replace(/_/g, ' ').toUpperCase();
        return {
          titulo: nombreLimpio,
          tituloMin: nombreLimpio.toLowerCase(), // Para buscar coincidencias
          src: a.download_url
        };
      });

      // Agrupar por géneros
      generos.forEach(genero => {
        let cancionesFiltradas = [];

        if (genero.nombre === "POR DESCUBRIR") {
          // Lógica especial para "Por descubrir": si no tiene ninguna palabra clave de los otros géneros
          cancionesFiltradas = canciones.filter(c => {
            let tieneClave = false;
            // Revisamos si pertenece a algún otro género
            generos.slice(0, -1).forEach(g => {
              if (g.clave.some(palabra => c.tituloMin.includes(palabra))) {
                tieneClave = true;
              }
            });
            return !tieneClave; // Si no tiene clave, va aquí
          });
        } else {
          // Filtrar por palabras clave
          cancionesFiltradas = canciones.filter(c => 
            genero.clave.some(palabra => c.tituloMin.includes(palabra))
          );
        }

        // Si hay canciones en este género, creamos la sección
        if (cancionesFiltradas.length > 0) {
          crearSeccionGenero(genero.nombre, cancionesFiltradas);
        }
      });

    } catch (e) {
      console.log("Error al cargar biblioteca");
      contenedor.innerHTML = '<p class="empty-message">Error al cargar la biblioteca.</p>';
    }
  }

  function crearSeccionGenero(nombreGenero, listaCanciones) {
    const section = document.createElement('div');
    section.className = 'genre-section';

    const header = document.createElement('h2');
    header.className = 'genre-header';
    header.textContent = nombreGenero;
    section.appendChild(header);

    const ul = document.createElement('ul');
    ul.className = 'song-list';

    listaCanciones.forEach(cancion => {
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
      ul.appendChild(li);
    });

    section.appendChild(ul);
    contenedor.appendChild(section);
  }

  cargarBiblioteca();
});

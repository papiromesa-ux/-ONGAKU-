// cerebros/auth.js
import { _db, _secAuth } from "../firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

export function iniciarBoda() {
  onAuthStateChanged(_secAuth, async (user) => {
    if (user) {
      // EL ALUMNO YA ESTÁ CASADO (Logueado en MIZUSHIKODE)
      const docRef = doc(_db, "estudiantes", user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Actualizamos el saludo con su género real
        actualizarSaludoPorGenero(data.genero);
      }
    } else {
      // SI NO HAY SESIÓN, LO MANDAMOS A LA ACADEMIA
      console.log("No hay sesión, redirigiendo a MIZUSHIKODE...");
      window.location.href = "https://papiromesa-ux.github.io/-MIZUSHIKODE-/pages/login.html";
    }
  });
}

function actualizarSaludoPorGenero(genero = 'hombre') {
  const hora = new Date().getHours();
  const esFemenino = genero.toLowerCase() === 'mujer' || genero.toLowerCase() === 'femenino';
  let saludo = "";

  if (hora >= 1 && hora < 7) saludo = esFemenino ? "HOLA, MADRUGADORA" : "HOLA, MADRUGADOR";
  else if (hora >= 7 && hora < 13) saludo = "BUENOS DÍAS";
  else if (hora >= 13 && hora < 19) saludo = "BUEN PROVECHO";
  else if (hora >= 19 && hora < 22) saludo = "BUENAS NOCHES";
  else saludo = esFemenino ? "HOLA, NOCTÁMBULA" : "HOLA, NOCTÁMBULO";

  const el = document.getElementById('dynamic-greeting');
  if(el) el.textContent = saludo;
}

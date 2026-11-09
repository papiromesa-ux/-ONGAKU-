import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCZzTU4hhezvzGqUfEp1DRbMu_uF4_j_2o",
  authDomain: "mizushikode-b56fa.firebaseapp.com",
  projectId: "mizushikode-b56fa",
  storageBucket: "mizushikode-b56fa.firebasestorage.app",
  messagingSenderId: "622967401832",
  appId: "1:622967401832:web:5dc315c5c282e4bd66fadd",
  measurementId: "G-GNMCMPDS3Q"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Exportamos Auth y Firestore
export const _secAuth = getAuth(app);
export const _db = getFirestore(app);

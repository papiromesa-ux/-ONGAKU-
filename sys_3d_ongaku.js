import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from 'https://cdn.jsdelivr.net/npm/@pixiv/three-vrm@3.0.0/lib/three-vrm.module.js';

// Escuchamos a que la música cargue primero
document.addEventListener('ongakuReady', () => {
  iniciarAudifonos();
  iniciarAlexander();
});

function iniciarAudifonos() {
  const container = document.getElementById('canvas-loading');
  if(!container) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 5);
  
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(250, 250);
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 1.5));
  const dir = new THREE.DirectionalLight(0x00f5d4, 2);
  dir.position.set(5, 5, 5);
  scene.add(dir);

  new GLTFLoader().load('./audifonos.glb', (gltf) => {
    const m = gltf.scene;
    scene.add(m);
    (function animate() {
      requestAnimationFrame(animate);
      m.rotation.y += 0.01;
      renderer.render(scene, camera);
    })();
  });
}

function iniciarAlexander() {
  const container = document.getElementById('vrm-container');
  if(!container) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  camera.position.set(0, 1.2, 3);
  
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(150, 150);
  container.appendChild(renderer.domElement);

  const loader = new GLTFLoader();
  loader.register((parser) => new VRMLoaderPlugin(parser));

  loader.load('./alexander.vrm', (gltf) => {
    const vrm = gltf.userData.vrm;
    VRMUtils.rotateVRM0(vrm);
    scene.add(vrm.scene);
    scene.add(new THREE.AmbientLight(0xffffff, 1.5));

    const clock = new THREE.Clock();
    (function animate() {
      requestAnimationFrame(animate);
      vrm.update(clock.getDelta());
      vrm.scene.position.y = Math.sin(clock.elapsedTime) * 0.05;
      renderer.render(scene, camera);
    })();
  });
}

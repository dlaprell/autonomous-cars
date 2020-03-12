import * as THREE from "three";
import * as ThreeControls from 'three-controls';

import { initTiles, GRID_SIZE } from './src/grid';
import { GridMovementPath } from './src/movement';
import { Car } from './src/car';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 2500);
camera.position.set(0, 100, 0);
// camera.lookAt(scene.position);


const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// update viewport on resize
window.addEventListener( 'resize', function() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize( width, height );
  camera.aspect = width / height; //aspect ratio
  camera.updateProjectionMatrix();
});

// controls
const controls = new ThreeControls.OrbitControls(camera);
controls.addEventListener('change', () => {
  render();
});

controls.minDistance = 1;
controls.maxDistance = 500; // 25;

scene.add(camera);

scene.background = new THREE.CubeTextureLoader()
  .setPath('/images/clouds1/')
  .load([
    'clouds1_north.jpg',
    'clouds1_south.jpg',
    'clouds1_up.jpg',
    'clouds1_down.jpg',
    'clouds1_west.jpg',
    'clouds1_east.jpg'
  ]);

const grid = initTiles();

const updateableObjects = [];

// Ground plane
new THREE.TextureLoader().load('/images/grass.png', grassTexture => {
  grassTexture.wrapS = THREE.RepeatWrapping; 
  grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.offset.x = 90 / (2 * Math.PI);

  grassTexture.repeat.set(64, 64);

  const grassMaterial = new THREE.MeshBasicMaterial({
    map: grassTexture,
    side: THREE.DoubleSide
  });

  const groundMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE, 32, 32),
    grassMaterial
  );

  groundMesh.rotation.x = Math.PI / 2;
  scene.add(groundMesh);

  grid.render();
  scene.add(grid.getGroup());

  window.app = {
    grid,
    scene
  };

  const path1 = new GridMovementPath(
    [ 0, 0 ], 1, [
      2, 2, 1, 0, 1, 1, 0, -1, -1, -1, 2, 2, 2, 1, 1, 1, 0, 0, -1, -1, 2, -1, 0, 0, 1, 1, 1, 2, -1, -1, 2, -1, 2, 1, 1, 1, 0, 0, 0, -1, -1, -1
    ]
  );

  const path2 = new GridMovementPath(
    [ 0, 0 ], 1, [
      2, 2, 1, 0, 1, 1, 0, -1, -1, -1, 2, 2, 2, 1, 1, 1, 0, 0, -1, -1, 2, -1, 0, 0, 1, 1, 1, 2, -1, -1, 2, -1, 2, 1, 1, 1, 0, 0, 0, -1, -1, -1
    ]
  );

  const car1 = new Car(grid, path1);
  const car2 = new Car(grid, path2);

  car2.onUpdate(({ x, y, angle }) => {
    camera.position.y = 1;
    camera.position.x = x;
    camera.position.z = y;

    camera.rotation.y = angle;
    camera.rotation.x = 0;
    camera.rotation.z = 0;
  });

  car1.setSpeed(0.004);
  car2.setSpeed(0.004);

  car1.render();
  car2.render();

  scene.add(car1.getGroup());
  scene.add(car2.getGroup());

  car1.update(10000);

  updateableObjects.push(car1, car2);

  animationLoop();
});


// Camera Position
camera.position.z = 3;

//game logic
function update(timeDeltaMs) {
  for (const obj of updateableObjects) {
    obj.update(timeDeltaMs);
  }
}

//render logic
function render() {
  renderer.render(scene, camera);
}

let last = null;

function animationLoop() {
  requestAnimationFrame(animationLoop);

  const now = new Date().getTime();

  let delta = 1;
  if (last !== null) {
    delta = now - last;
  }

  last = now;

  update(delta);
  render();
}

render();
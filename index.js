import * as THREE from "three";
import * as ThreeControls from 'three-controls';

const DEBUG_TILES = true;

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 2500);
// camera.position.set(0, 0, 0);
// camera.lookAt(scene.position);

var renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// update viewport on resize
window.addEventListener( 'resize', function() {
  var width = window.innerWidth;
  var height = window.innerHeight;
  renderer.setSize( width, height );
  camera.aspect = width / height; //aspect ratio
  camera.updateProjectionMatrix();
});

// controls
let controls = new ThreeControls.OrbitControls(camera);
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

const TILE_SIZE = 16;
const GRID_SIZE = TILE_SIZE * 4 /* 128 */; // Tile map 128 * 128
const LANE_WIDTH = 2.5;
const PAVEMENT_WIDTH = 0.5;
const LINE_WIDTH = 0.05;

const roadMaterial = new THREE.MeshBasicMaterial({ color: 0x777777, side: THREE.DoubleSide });
const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });

function renderTSection(xTile, yTile, rotation = 0) {
  const laneMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(LANE_WIDTH * 2, TILE_SIZE),
    roadMaterial
  );
  laneMesh.position.y = 0.0001;
  laneMesh.rotation.x = Math.PI / 2;

  const halfMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(TILE_SIZE / 2 - LANE_WIDTH, LANE_WIDTH * 2),
    roadMaterial
  );
  halfMesh.position.y = 0.0001;
  halfMesh.position.x += (TILE_SIZE / 2 - LANE_WIDTH) / 2 + LANE_WIDTH;
  halfMesh.rotation.x = Math.PI / 2;

  const leftLineMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(LINE_WIDTH, TILE_SIZE),
    lineMaterial
  );
  leftLineMesh.position.y = 0.0002;
  leftLineMesh.position.x -= (LINE_WIDTH / 2) + LANE_WIDTH;
  leftLineMesh.rotation.x = Math.PI / 2;

  const rightTopLineMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(LINE_WIDTH, TILE_SIZE / 2 - LANE_WIDTH),
    lineMaterial
  );
  rightTopLineMesh.position.y = 0.0002;
  rightTopLineMesh.position.x += (LINE_WIDTH / 2) + LANE_WIDTH;
  rightTopLineMesh.position.z += (TILE_SIZE / 2 - LANE_WIDTH) / 2 + LANE_WIDTH;
  rightTopLineMesh.rotation.x = Math.PI / 2;

  const centerTopLineMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(LINE_WIDTH, TILE_SIZE / 2 - LANE_WIDTH),
    lineMaterial
  );
  centerTopLineMesh.position.y = 0.0002;
  centerTopLineMesh.position.x += (LINE_WIDTH / 2);
  centerTopLineMesh.position.z += (TILE_SIZE / 2 - LANE_WIDTH) / 2 + LANE_WIDTH;
  centerTopLineMesh.rotation.x = Math.PI / 2;

  const rightBottomLineMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(LINE_WIDTH, TILE_SIZE / 2 - LANE_WIDTH),
    lineMaterial
  );
  rightBottomLineMesh.position.y = 0.0002;
  rightBottomLineMesh.position.x += (LINE_WIDTH / 2) + LANE_WIDTH;
  rightBottomLineMesh.position.z -= (TILE_SIZE / 2 - LANE_WIDTH) / 2 + LANE_WIDTH;
  rightBottomLineMesh.rotation.x = Math.PI / 2;

  const centerBottomLineMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(LINE_WIDTH, TILE_SIZE / 2 - LANE_WIDTH),
    lineMaterial
  );
  centerBottomLineMesh.position.y = 0.0002;
  centerBottomLineMesh.position.x += (LINE_WIDTH / 2);
  centerBottomLineMesh.position.z -= (TILE_SIZE / 2 - LANE_WIDTH) / 2 + LANE_WIDTH;
  centerBottomLineMesh.rotation.x = Math.PI / 2;

  const armCenterLineMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(TILE_SIZE / 2 - LANE_WIDTH, LINE_WIDTH),
    lineMaterial
  );
  armCenterLineMesh.position.y = 0.0002;
  armCenterLineMesh.position.x += (TILE_SIZE / 2 - LANE_WIDTH) / 2 + LANE_WIDTH;
  armCenterLineMesh.rotation.x = Math.PI / 2;

  const armTopLineMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(TILE_SIZE / 2 - LANE_WIDTH, LINE_WIDTH),
    lineMaterial
  );
  armTopLineMesh.position.y = 0.0002;
  armTopLineMesh.position.x += (TILE_SIZE / 2 - LANE_WIDTH) / 2 + LANE_WIDTH;
  armTopLineMesh.position.z -= LANE_WIDTH - (LINE_WIDTH / 2);
  armTopLineMesh.rotation.x = Math.PI / 2;

  const armBottomLineMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(TILE_SIZE / 2 - LANE_WIDTH, LINE_WIDTH),
    lineMaterial
  );
  armBottomLineMesh.position.y = 0.0002;
  armBottomLineMesh.position.x += (TILE_SIZE / 2 - LANE_WIDTH) / 2 + LANE_WIDTH;
  armBottomLineMesh.position.z += LANE_WIDTH - (LINE_WIDTH / 2);
  armBottomLineMesh.rotation.x = Math.PI / 2;

  const tileGroup = new THREE.Group();
  tileGroup.add(laneMesh);
  tileGroup.add(halfMesh);
  tileGroup.add(leftLineMesh);
  tileGroup.add(rightTopLineMesh);
  tileGroup.add(rightBottomLineMesh);
  tileGroup.add(centerBottomLineMesh);
  tileGroup.add(centerTopLineMesh);
  tileGroup.add(armCenterLineMesh);
  tileGroup.add(armTopLineMesh);
  tileGroup.add(armBottomLineMesh);
  
  if (DEBUG_TILES) {
    // const 
  }

  tileGroup.position.x += -(TILE_SIZE / 2) - (GRID_SIZE / 2) + (xTile * TILE_SIZE);
  tileGroup.position.z += -(TILE_SIZE / 2) - (GRID_SIZE / 2) + (yTile * TILE_SIZE);
  tileGroup.rotation.y = rotation;

  scene.add(tileGroup);
}

function renderCurveLandRoad(xTile, yTile, rotation = 0) {
  function getOutlineGeometry(radiusOuter, radiusInner) {
    const curvedShape = new THREE.Shape();

    const anchorX = TILE_SIZE / 2;
    const anchorY = TILE_SIZE / 2;

    curvedShape.moveTo(anchorX - radiusOuter, anchorY);
    curvedShape.lineTo(anchorX - radiusInner, anchorY);
    curvedShape.absarc(
      anchorX,
      anchorY,
      radiusInner,
      -Math.PI,
      -Math.PI / 2,
      false
    );
    curvedShape.lineTo(anchorX, anchorY - radiusOuter);

    curvedShape.absarc(
      anchorX,
      anchorY,
      radiusOuter,
      -Math.PI / 2,
      -Math.PI,
      true
    );

    return new THREE.ShapeGeometry(curvedShape);
  }

  const curvedGeometry = getOutlineGeometry(
    TILE_SIZE / 2 + LANE_WIDTH,
    TILE_SIZE / 2 - LANE_WIDTH
  );
  const curveMesh = new THREE.Mesh(curvedGeometry, roadMaterial);
  curveMesh.position.y = 0.0001;
  curveMesh.rotation.x = Math.PI / 2;

  const centerLineGeometry = getOutlineGeometry(
    (TILE_SIZE / 2) - (LINE_WIDTH / 2),
    (TILE_SIZE / 2) + (LINE_WIDTH / 2)
  );
  const centerLineMesh = new THREE.Mesh(centerLineGeometry, lineMaterial);
  centerLineMesh.position.y = 0.0002;
  centerLineMesh.rotation.x = Math.PI / 2;

  const outerLineGeometry = getOutlineGeometry(
    (TILE_SIZE / 2) + LANE_WIDTH + LINE_WIDTH,
    (TILE_SIZE / 2) + LANE_WIDTH
  );
  const outerLineMesh = new THREE.Mesh(outerLineGeometry, lineMaterial);
  outerLineMesh.position.y = 0.0002;
  outerLineMesh.rotation.x = Math.PI / 2;

  const innerLineGeometry = getOutlineGeometry(
    (TILE_SIZE / 2) - LANE_WIDTH - LINE_WIDTH,
    (TILE_SIZE / 2) - LANE_WIDTH
  );
  const innerLineMesh = new THREE.Mesh(innerLineGeometry, lineMaterial);
  innerLineMesh.position.y = 0.0002;
  innerLineMesh.rotation.x = Math.PI / 2;

  const curveGroup = new THREE.Group();
  curveGroup.add(curveMesh);
  curveGroup.add(centerLineMesh);
  curveGroup.add(outerLineMesh);
  curveGroup.add(innerLineMesh);

  curveGroup.position.x += -(TILE_SIZE / 2) - (GRID_SIZE / 2) + (xTile * TILE_SIZE);
  curveGroup.position.z += -(TILE_SIZE / 2) - (GRID_SIZE / 2) + (yTile * TILE_SIZE);
  curveGroup.rotation.y = rotation;

  scene.add(curveGroup);
}

function renderLandRoad(xTile, yTile, rotation = 0) {
  const laneMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(LANE_WIDTH * 2, TILE_SIZE),
    roadMaterial
  );
  laneMesh.position.y = 0.0001;
  laneMesh.rotation.x = Math.PI / 2;

  const centerLineMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(LINE_WIDTH, TILE_SIZE),
    lineMaterial
  );
  centerLineMesh.position.y = 0.0002;
  centerLineMesh.rotation.x = Math.PI / 2;

  const leftLineMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(LINE_WIDTH, TILE_SIZE),
    lineMaterial
  );
  leftLineMesh.position.y = 0.0002;
  leftLineMesh.position.x -= (LINE_WIDTH / 2) + LANE_WIDTH;
  leftLineMesh.rotation.x = Math.PI / 2;

  const rightLineMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(LINE_WIDTH, TILE_SIZE),
    lineMaterial
  );
  rightLineMesh.position.y = 0.0002;
  rightLineMesh.position.x += (LINE_WIDTH / 2) + LANE_WIDTH;
  rightLineMesh.rotation.x = Math.PI / 2;

  const roadGroup = new THREE.Group();
  roadGroup.add(laneMesh);
  roadGroup.add(centerLineMesh);
  roadGroup.add(leftLineMesh);
  roadGroup.add(rightLineMesh);

  roadGroup.position.x += -(TILE_SIZE / 2) - (GRID_SIZE / 2) + (xTile * TILE_SIZE);
  roadGroup.position.z += -(TILE_SIZE / 2) - (GRID_SIZE / 2) + (yTile * TILE_SIZE);
  roadGroup.rotation.y = rotation;

  scene.add(roadGroup);
}

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

  renderLandRoad(2, 1, Math.PI / 2);
  renderLandRoad(1, 2, 0);
  renderCurveLandRoad(1, 1, 0);
  renderTSection(1, 3, 0);
  renderCurveLandRoad(2, 3, Math.PI);
  renderCurveLandRoad(1, 4, Math.PI / 2);
  renderLandRoad(2, 4, Math.PI / 2);
  renderLandRoad(3, 4, Math.PI / 2);
  renderCurveLandRoad(4, 4, Math.PI);
  renderLandRoad(4, 3, 0);

  renderCurveLandRoad(2, 2, 0);
  renderLandRoad(3, 2, Math.PI / 2);
  renderTSection(4, 2, Math.PI);
  renderCurveLandRoad(4, 1, -Math.PI / 2);
  renderLandRoad(3, 1, Math.PI / 2);
});


// Camera Position
camera.position.z = 3;

//game logic
function update() {

}

//render logic
function render() {
  renderer.render( scene, camera );
}

//run game loop (update, render, repeat)
function GameLoop () {
  requestAnimationFrame( GameLoop);
  update();
  render();
}

GameLoop();
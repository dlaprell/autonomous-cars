import * as THREE from 'three';

const TYPES = {
  PLAIN: 0,
  ROAD: 1,
  CURVE: 2,
  T_SECTION: 3
};

const GRID_TILE_WIDTH = 4;
const TILE_SIZE = 16;
const GRID_SIZE = TILE_SIZE * GRID_TILE_WIDTH /* 128 */; // Tile map 128 * 128
const LANE_WIDTH = 2.5;
const PAVEMENT_WIDTH = 0.5;
const LINE_WIDTH = 0.05;

const roadMaterial = new THREE.MeshBasicMaterial({ color: 0x777777, side: THREE.DoubleSide });
const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });

class Tile {
  constructor(type, rotation) {
    this._type = type;
    this._rotation = rotation;

    this._group = new THREE.Group();
  }

  getGroup() {
    return this._group;
  }

  getType() {
    return this._type;
  }

  add(obj) {
    this._group.add(obj);
  }

  render(xTile, yTile) {
    this._group.position.x += -(TILE_SIZE / 2) - (GRID_SIZE / 2) + (xTile * TILE_SIZE);
    this._group.position.z += -(TILE_SIZE / 2) - (GRID_SIZE / 2) + (yTile * TILE_SIZE);
    this._group.position.y = 0.0001;
    this._group.rotation.y = this._rotation * Math.PI;
    this._group.rotation.x = Math.PI / 2;
  }
}

class RoadTile extends Tile {
  constructor(rotation) {
    super(TYPES.ROAD, rotation);

    const laneMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(LANE_WIDTH * 2, TILE_SIZE),
      roadMaterial
    );
    laneMesh.position.y = 0.0001;
  
    const centerLineMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(LINE_WIDTH, TILE_SIZE),
      lineMaterial
    );
  
    const leftLineMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(LINE_WIDTH, TILE_SIZE),
      lineMaterial
    );
    leftLineMesh.position.x -= (LINE_WIDTH / 2) + LANE_WIDTH;
  
    const rightLineMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(LINE_WIDTH, TILE_SIZE),
      lineMaterial
    );
    rightLineMesh.position.x += (LINE_WIDTH / 2) + LANE_WIDTH;

    this.add(laneMesh);

    const lineGroup = new THREE.Group();
    lineGroup.add(centerLineMesh);
    lineGroup.add(leftLineMesh);
    lineGroup.add(rightLineMesh);
    lineGroup.position.y = 0.0002;
  
    this.add(lineGroup);
  }
}

const TILE_BY_TYPE = {
  [TYPES.PLAIN]: Tile,
  [TYPES.ROAD]: RoadTile,
  [TYPES.CURVE]: Tile,
  [TYPES.T_SECTION]: Tile
};

export {
  TYPES,

  GRID_TILE_WIDTH,
  TILE_SIZE,
  GRID_SIZE,
  LANE_WIDTH,
  PAVEMENT_WIDTH,
  LINE_WIDTH,

  TILE_BY_TYPE
};
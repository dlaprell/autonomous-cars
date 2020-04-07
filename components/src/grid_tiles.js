import * as THREE from 'three';

import { rotate, normalizeRotation } from './utils';
import { Tree } from './tree';
import { GLTFLoader } from '../third-party/GLTFLoader';

const DEBUG_TILES = false;
const DEBUG_MOVEMENT = false;

const TYPES = {
  PLAIN: 0,
  ROAD: 1,
  CURVE: 2,
  T_SECTION: 3,
  TREE: 4
};

const TILE_SIZE = 16;
const LANE_WIDTH = 2.5;
const PAVEMENT_WIDTH = 1.0;
const LINE_WIDTH = 0.05;

function interpolerateCurveMovement(from, to, distance, rotation) {
  // First invert the rotation, then rotate the from accordingly
  // -> rotFrom is now either 1 or 2
  const rotFrom = rotate(from, -rotation);

  const movRadius = (TILE_SIZE / 2) - (LANE_WIDTH / 2)
    + (rotFrom === 1 ? 1 : 0) * LANE_WIDTH; // 2 -> inner lane, 1 outer lane

  const circleLength = Math.PI * 2 * movRadius;
  const amountMov = distance / circleLength;

  // Overshoot if more than 0.25 -> would move beyond the curve
  if (amountMov > 0.25) {
    return {
      x: null, y: null, angle: null,

      overshoot: distance - (circleLength * 0.25)
    };
  }

  const moveByDeg = (2 * Math.PI) * amountMov;

  // Now also honor whether we go from down -> right or vice versa
  const movAngle = rotFrom === 2
    ? (3.0 / 2.0 * Math.PI) + moveByDeg // from down
    : -1 * moveByDeg; // from right

  const dirAngle = movAngle + (Math.PI / 2) * (rotFrom === 2 ? 1 : -1);

  const xRef = TILE_SIZE + (movRadius * Math.sin(movAngle));
  const yRef = TILE_SIZE - (movRadius * Math.cos(movAngle));

  // Now rotate the coordinates back
  let x = xRef;
  let y = yRef;
  let angle = dirAngle;

  if (rotation === -1) {
    x = yRef;
    y = TILE_SIZE - xRef;
    angle -= (Math.PI / 2);
  } else if (rotation === 1) {  
    x = TILE_SIZE - yRef;
    y = xRef;
    angle += (Math.PI / 2)
  } else if (rotation === 2) {
    x = TILE_SIZE - xRef;
    y = TILE_SIZE - yRef;
    angle += Math.PI;
  }

  return {
    x,
    y,
    angle,
    overshoot: 0
  };
}

function interpolerateStraightMovement(from, to, distance, rotation) {
  const isVert = from === 0 || from === 2;
  const isInv = from === 2 || from === 1;

  // now derive angle, x, y from it
  const centerOfLane = (TILE_SIZE / 2) - (LANE_WIDTH / 2) + ((isInv ^ !isVert) ? LANE_WIDTH : 0);
  const pos = isInv ? TILE_SIZE - distance : distance;

  return {
    x: isVert ? centerOfLane : pos,
    y: isVert ? pos : centerOfLane,
    angle: to * (Math.PI / 2),
    overshoot: Math.max(0, distance - TILE_SIZE)
  };
}

function calculateCurveGeometry(radiusOuter, radiusInner) {
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

class Tile {
  constructor(type, rotation) {
    this._type = type;
    this._rotation = rotation;

    this._group = new THREE.Group();
    this._group.receiveShadow = true;

    if (DEBUG_TILES) {
      const outlineShape = new THREE.Shape();
  
      const anchorX = TILE_SIZE / 2;
      const anchorY = TILE_SIZE / 2;
    
      outlineShape.moveTo(anchorX, anchorY);
      outlineShape.lineTo(anchorX, -anchorY);
      outlineShape.lineTo(-anchorX, -anchorY);
      outlineShape.lineTo(-anchorX, anchorY);
      outlineShape.lineTo(anchorY, anchorY);

      const mesh = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(outlineShape.getPoints()),
        new THREE.LineBasicMaterial({ color: 0xFF0000 })
      );

      const circle = new THREE.Mesh(
        new THREE.CircleGeometry(0.25),
        new THREE.MeshBasicMaterial({ color: 0xFF0000, side: THREE.DoubleSide })
      );

      circle.position.y -= (TILE_SIZE / 2) - 1;

      mesh.position.y += 0.1;
      circle.position.x += 0.1;

      this._group.add(circle);
      this._group.add(mesh);
    }
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

  speedLimitation() {
    return 0.006;
  }

  entranceSides() {
    return [];
  }

  exitSides() {
    return [];
  }

  interpolerateMovement(from, to, distance) {
    return { x: 0, y: 0, angle: 0 };
  }

  render() {
    this._group.position.x += (TILE_SIZE / 2);
    this._group.position.z += (TILE_SIZE / 2);
    this._group.position.y = 0.01;
    this._group.rotation.z = this._rotation * (Math.PI / 2);
    this._group.rotation.x = Math.PI / 2;
  }
}

class RoadTile extends Tile {
  constructor(rotation) {
    super(TYPES.ROAD, rotation);

    // new THREE.TextureLoader()
    //   .load('/images/tiles/road_straight.png', (texture) => {
    //     const tile = new THREE.Mesh(
    //       new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE, 2, 2),
    //       new THREE.MeshLambertMaterial( {
    //         map: texture,
    //         side: THREE.BackSide,
    //         transparent: true
    //        })
    //     );
    
    //     this.add(tile);
    //   });

    new GLTFLoader()
      .load(`/objects/Gerade.gltf`, (gltf) => {
        const object = gltf.scene;
        // object.scale.multiplyScalar(0.3);

        object.rotation.x = -Math.PI / 2;
        
        object.receiveShadow = true;
        this.add(object);
      }, null, err => console.error(err));
  }

  entranceSides() {
    if ((Math.abs(this._rotation) % 2) === 0) {
      return [ 0, 2 ];
    } else {
      return [ -1, 1 ];
    }
  }

  exitSides() {
    return this.entranceSides();
  }

  interpolerateMovement(from, to, distance) {
    if (DEBUG_MOVEMENT) {
      const en = this.entranceSides();
      const ex = this.exitSides();

      if (en.indexOf(from) === -1 || ex.indexOf(to) === -1) {
        throw new Error("Movement with the supplied from / to is not possible");
      }
    }

    return interpolerateStraightMovement(from, to, distance, this._rotation);
  }
}

class CurveTile extends Tile {
  constructor(rotation) {
    super(TYPES.CURVE, rotation);

    // new THREE.TextureLoader()
    //   .load('/images/tiles/road_curve.png', (texture) => {
    //     const tile = new THREE.Mesh(
    //       new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE, 2, 2),
    //       new THREE.MeshLambertMaterial( {
    //         map: texture,
    //         side: THREE.BackSide,
    //         transparent: true
    //       })
    //     );

    //     tile.rotation.z += Math.PI / 2;
    
    //     this.add(tile);
    //   });

    new GLTFLoader()
      .load(`/objects/Kurve.gltf`, (gltf) => {
        const object = gltf.scene;
        // object.scale.multiplyScalar(0.3);

        object.rotation.x = -Math.PI / 2;
        
        object.receiveShadow = true;
        this.add(object);
      }, null, err => console.error(err));
  }

  _getOutlineGeometry(radiusOuter, radiusInner) {
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

  entranceSides() {
    if (this._rotation === 0) {
      return [ 1, 2 ];
    } else if (this._rotation === 1) {
      return [ 2, -1 ];
    } else if (this._rotation === 2) {
      return [ -1, 0 ];
    } else { // rotation == -1
      return [ 0, 1 ];
    }
  }

  exitSides() {
    return this.entranceSides();
  }

  interpolerateMovement(from, to, distance) {
    if (DEBUG_MOVEMENT) {
      const en = this.entranceSides();
      const ex = this.exitSides();

      if (en.indexOf(from) === -1 || ex.indexOf(to) === -1) {
        throw new Error("Movement with the supplied from / to is not possible");
      }
    }

    return interpolerateCurveMovement(from, to, distance, this._rotation);
  }
}

class TSectionTile extends Tile {
  constructor(rotation) {
    super(TYPES.T_SECTION, rotation);

    new THREE.TextureLoader()
      .load('/images/tiles/road_t_section.png', (texture) => {
        const tile = new THREE.Mesh(
          new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE, 2, 2),
          new THREE.MeshLambertMaterial( {
            map: texture,
            side: THREE.BackSide,
            transparent: true
           })
        );
    
        this.add(tile);
      });
  }

  entranceSides() {
    if (this._rotation === 0) {
      return [ 0, 1, 2 ];
    } else if (this._rotation === 1) {
      return [ 1, 2, -1 ];
    } else if (this._rotation === 2) {
      return [ 2, -1, 0 ];
    } else { // rotation == -1
      return [ -1, 0, 1 ];
    }
  }

  exitSides() {
    return this.entranceSides();
  }

  interpolerateMovement(from, to, distance) {
    if (DEBUG_MOVEMENT) {
      const en = this.entranceSides();
      const ex = this.exitSides();

      if (en.indexOf(from) === -1 || ex.indexOf(to) === -1) {
        throw new Error("Movement with the supplied from / to is not possible");
      }
    }

    const isCurve = ((from + to) % 2) != 0;

    if (isCurve) {
      // Normalize the from and to according to the rotation
      const normFrom = rotate(from, -this._rotation);
      const normTo = rotate(to, -this._rotation);

      const rotation = normalizeRotation(
        ((normFrom === 0 || normTo === 0) ? -1 : 0) // rotate if needed
        + this._rotation // Rotate according to this tile rotation
      );

      return interpolerateCurveMovement(
        from,
        to,
        distance,
        rotation
      );
    } else {
      return interpolerateStraightMovement(from, to, distance, this._rotation);
    }
  }
}

const treeDis = [
  { type: Tree.TYPES.SPREADING, mean: 12 },
  { type: Tree.TYPES.PYRAMIDAL, mean: 4 },
  { type: Tree.TYPES.OPEN, mean: 1 },
  { type: Tree.TYPES.ROUND, mean: 8 },
  { type: Tree.TYPES.BRANCHED, mean: 3 },
];

class TreeTile extends Tile {
  constructor(rotation, { random }) {
    super(TYPES.TREE, rotation);

    const rnd = random.derive();
    
    for (const { type, mean, deviation } of treeDis) {
      const count = Math.round(rnd.normalDistribution(mean).value());

      for (let i = 0; i < count; i++) {
        const t = new Tree(type);
        t.render();
  
        const treeGroup = t.group();
        treeGroup.position.x += random.integer(-8, 8);
        treeGroup.position.y += random.integer(-8, 8);
  
        this.add(treeGroup);
      }
    }
  }
}

const TILE_BY_TYPE = {
  [TYPES.PLAIN]: Tile,
  [TYPES.ROAD]: RoadTile,
  [TYPES.CURVE]: CurveTile,
  [TYPES.T_SECTION]: TSectionTile,
  [TYPES.TREE]: TreeTile
};

export {
  TYPES,

  TILE_SIZE,
  LANE_WIDTH,
  PAVEMENT_WIDTH,
  LINE_WIDTH,

  TILE_BY_TYPE,

  calculateCurveGeometry
};
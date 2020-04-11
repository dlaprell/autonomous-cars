import * as THREE from 'three';
import { MeshLambertMaterial, DoubleSide } from 'three';

import { rotate, normalizeRotation } from './utils';
import { adaptTreeObject } from './tree';

const DEBUG_TILES = false;
const DEBUG_MOVEMENT = false;

const TYPES = {
  PLAIN: 0,
  ROAD: 1,
  CURVE: 2,
  T_SECTION: 3,
  TREE: 4,
  HOUSE: 5
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

const streetMaterial = new MeshLambertMaterial({
  color: '#918e84',
  side: DoubleSide
});

const surroundingMaterial = new MeshLambertMaterial({
  color: '#88bd99',
  side: DoubleSide
});

const sideWalkMaterial = new MeshLambertMaterial({
  color: '#969492',
  side: DoubleSide
});

function adaptStreetObject(obj) {
  const o = obj.clone();

  o.traverse((child) => {
    if (!child.isMesh) {
      return;
    }

    if (child.name.endsWith('Surrounding')) {
      child.material = surroundingMaterial;
      child.visible = false;
    }
  
    if (child.name.endsWith('Street')) {
      child.material = streetMaterial;
    }

    if (child.name.endsWith('Sidewalk')) {
      child.material = sideWalkMaterial;
    }
  });

  o.rotation.x -= Math.PI;
  o.receiveShadow = true;
  return o;
}

class Tile {
  constructor(type, rotation, baseOptions) {
    this._type = type;
    this._rotation = rotation;

    this._group = new THREE.Group();
    this._group.receiveShadow = true;

    if (DEBUG_TILES || (baseOptions && baseOptions.drawBorders)) {
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

      this.add(circle);
      this.add(mesh);
    }

    this._ownLanes = [];
    this._lanes = {
      '0': null,
      '-1': null,
      '1': null,
      '2': null
    };
  }

  addBench(models, inner = false) {
    const bench = models.streetDecorationBench.clone();

    bench.rotation.x = Math.PI;

    if (inner) {
      bench.rotation.z = Math.PI;

      bench.position.x -= 6;
      bench.position.y += 3;
    } else {
      bench.rotation.z = -Math.PI / 2;

      bench.position.y -= 6;
      bench.position.x += 3;
    }

    this.add(bench);
  }

  addTrashCan(models, inner = false) {
    const bench = models.streetDecorationTrashcan.clone();
    bench.rotation.x = Math.PI;

    if (inner) {
      bench.position.x -= 6;
      bench.position.y -= 3;
    } else {
      bench.rotation.z = Math.PI / 2;

      bench.position.y -= 6;
      bench.position.x -= 3;
    }

    this.add(bench);
  }

  getRotation() {
    return this._rotation;
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
    return 0.01;
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

  getTotalDistance(from, to) {
    const dis = TILE_SIZE * 3;
    const { overshoot } = this.interpolerateMovement(from, to, dis);
    return dis - overshoot;
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
  constructor(rotation, { models, drawBorders }, options) {
    super(TYPES.ROAD, rotation, { drawBorders });

    const o = adaptStreetObject(models.streetStraight);
    o.rotation.z += Math.PI / 2;
    this.add(o);

    if (options.bench) {
      this.addBench(models, true);
    }

    if (options.trashCan) {
      this.addTrashCan(models, true);
    }
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
  constructor(rotation, { models, drawBorders }) {
    super(TYPES.CURVE, rotation, { drawBorders });

    this.add(adaptStreetObject(models.streetCurve));
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
  constructor(rotation, { models, drawBorders }, options) {
    super(TYPES.T_SECTION, rotation, { drawBorders });

    this.add(adaptStreetObject(models.streetTCross));

    if (options.bench) {
      this.addBench(models, true);
    }

    if (options.trashCan) {
      this.addTrashCan(models, true);
    }
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
  { type: 'Spreading', mean: 12 },
  { type: 'Pyramidal', mean: 4 },
  { type: 'Open', mean: 1 },
  { type: 'Round', mean: 8 },
  { type: 'Branched', mean: 3 },
];

class TreeTile extends Tile {
  constructor(rotation, { random, models, drawBorders }, options) {
    super(TYPES.TREE, rotation, { drawBorders });

    const rnd = random.derive();

    const hasSideDecoration = options.bench && options.trashCan;
    
    for (const { type, mean } of treeDis) {
      const count = Math.round(rnd.normalDistribution(mean).value());

      for (let i = 0; i < count; i++) {
        const t = adaptTreeObject(models[`tree${type}`]);
  
        t.position.x += random.integer(-7, 7);
        t.position.y += random.integer(hasSideDecoration ? -4 : -7, 7);
  
        this.add(t);
      }
    }

    if (options.bench) {
      this.addBench(models);
    }

    if (options.trashCan) {
      this.addTrashCan(models);
    }
  }
}

class HouseTile extends Tile {
  constructor(rotation, { models, drawBorders }, options) {
    super(TYPES.HOUSE, rotation, { drawBorders });
    const type = options.type || 'Simple';
    
    const house = models[`architectureHouse${type}`].clone();
    house.rotation.x = Math.PI;
    if (type === 'Flat') {
      house.rotation.z = -Math.PI / 2;
    } else {
      house.rotation.z = Math.PI;
    }

    if (type === 'Double') {
      house.position.x -= TILE_SIZE / 2;
    }

    house.position.z += 0.25;

    house.traverse(child => {
      if (child.isMesh && child.name.indexOf('Surrounding') !== -1) {
        child.visible = false;
      }
    });

    this.add(house);

    if (options.bench) {
      this.addBench(models);
    }

    if (options.trashCan) {
      this.addTrashCan(models);
    }
  }
}

class PlainTile extends Tile {
  constructor(rotation, { drawBorders, models }, options) {
    super(TYPES.PLAIN, rotation, { drawBorders });

    if (options.bench) {
      this.addBench(models);
    }

    if (options.trashCan) {
      this.addTrashCan(models);
    }
  }
}

const TILE_BY_TYPE = {
  [TYPES.PLAIN]: PlainTile,
  [TYPES.ROAD]: RoadTile,
  [TYPES.CURVE]: CurveTile,
  [TYPES.T_SECTION]: TSectionTile,
  [TYPES.TREE]: TreeTile,
  [TYPES.HOUSE]: HouseTile
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
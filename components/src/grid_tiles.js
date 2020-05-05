// @ts-check

import {
  Mesh,
  Group,

  CircleGeometry,
  ShapeGeometry,
  BufferGeometry,
  Shape,
  Line,

  MeshBasicMaterial,
  LineBasicMaterial,
  DoubleSide
} from 'three';

import { rotate, normalizeRotation, angle } from './utils';
import { assert } from '../utils/assert';
import { RandomGen } from './randomgen';
import { getForestGeometriesCached } from './tree';

/** @typedef {import('./lane').Lane} Lane */

/**
 * @typedef {Object} TileSideLanes
 * @property {Lane?} incoming
 * @property {Lane?} outgoing
 */

const DEBUG_TILES = false;
const DEBUG_MOVEMENT = false;

/** @typedef { 0 | 1 | 2 | 3 | 4 | 20 | 30 } TileTypes */

/** @typedef { 0 | 1 | 2 | -1} TileOrientation */

/** @typedef {[ TileTypes, TileOrientation, Object ]} TileBaseData */

/** @type {Object.<string,TileTypes>} */
const TYPES = {
  PLAIN: 0,
  ROAD: 1,
  CURVE: 2,
  T_SECTION: 3,
  CROSS: 4,
  FOREST: 20,
  HOUSE: 30
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

  // during the curve progress, this value goes from
  const viewAmplifier = 1 - Math.pow(((amountMov / 0.125) - 1), 2);

  const angleMultiplier = (rotFrom === 2 ? 1 : -1);

  const xRef = TILE_SIZE + (movRadius * Math.sin(movAngle));
  const yRef = TILE_SIZE - (movRadius * Math.cos(movAngle));

  // Now rotate the coordinates back
  let x = xRef;
  let y = yRef;

  let angle = movAngle + angleMultiplier * (Math.PI / 2);
  let angleSmoothed = movAngle + angleMultiplier * (Math.PI / 2 + Math.PI / 8 * viewAmplifier);

  if (rotation === -1) {
    x = yRef;
    y = TILE_SIZE - xRef;
    angle -= (Math.PI / 2);
    angleSmoothed -= (Math.PI / 2);
  } else if (rotation === 1) {
    x = TILE_SIZE - yRef;
    y = xRef;
    angle += (Math.PI / 2);
    angleSmoothed += (Math.PI / 2);
  } else if (rotation === 2) {
    x = TILE_SIZE - xRef;
    y = TILE_SIZE - yRef;
    angle += Math.PI;
    angleSmoothed += Math.PI;
  }

  return {
    x,
    y,
    angle,
    angleSmoothed,
    overshoot: 0
  };
}

function interpolerateStraightMovement(from, to, distance, rotation) {
  const isVert = from === 0 || from === 2;
  const isInv = from === 2 || from === 1;

  // now derive angle, x, y from it
  const centerOfLane = (TILE_SIZE / 2) - (LANE_WIDTH / 2) + ((isInv !== !isVert) ? LANE_WIDTH : 0);
  const pos = isInv ? TILE_SIZE - distance : distance;

  return {
    x: isVert ? centerOfLane : pos,
    y: isVert ? pos : centerOfLane,
    angle: to * (Math.PI / 2),
    angleSmoothed: to * (Math.PI / 2),
    overshoot: Math.max(0, distance - TILE_SIZE)
  };
}

function calculateCurveGeometry(radiusOuter, radiusInner) {
  const curvedShape = new Shape();

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

  return new ShapeGeometry(curvedShape);
}

function adaptStreetObject(obj) {
  const o = obj.clone();

  const objs = {};

  o.traverse((child) => {
    if (!child.isMesh) {
      return;
    }

    if (child.name.endsWith('Surrounding')) {
      child.visible = false;
      objs.surroundings = child;
      child.receiveShadow = true;
    }

    if (child.name.endsWith('Street')) {
      objs.street = child;
      child.receiveShadow = true;
    }

    if (child.name.endsWith('Sidewalk')) {
      objs.sidewalk = child;
      child.receiveShadow = true;
    }
  });

  o.rotation.x -= Math.PI;
  o.receiveShadow = true;

  objs.full = o;

  return objs;
}


function extractDecorationOptions(tileType, options) {
  const { bench, trashCan, decorations } = (options || {});

  if (decorations) {
    return decorations;
  }

  const dec = {};

  if (bench) {
    let side;

    // top right for forest / house; road bottom left
    if (tileType === TYPES.ROAD || tileType === TYPES.T_SECTION) {
      side = 'bottomLeft';
    } else {
      side = 'topRight';
    }

    dec[side] = {
      type: 'bench',
      ...(bench && typeof bench === 'object' ? bench : {})
    };
  }

  if (trashCan) {
    let side;

    if (tileType === TYPES.ROAD || tileType === TYPES.T_SECTION) {
      side = 'topLeft';
    } else {
      side = 'topLeft';
    }

    dec[side] = {
      type: 'trashcan',
      ...(trashCan && typeof trashCan === 'object' ? trashCan : {})
    };
  }

  return dec;
}

class Tile {
  /**
   * @param {TileTypes} type
   * @param {TileOrientation} rotation
   * @param {Object} baseOptions
   */
  constructor(type, rotation, baseOptions) {
    this._type = type;
    this._rotation = rotation;

    this._group = new Group();
    // this._group.receiveShadow = true;
    this._group.matrixAutoUpdate = false;

    /** @type {THREE.BufferGeometry?} */
    this._laneGeometry = null;
    /** @type {THREE.BufferGeometry?} */
    this._sideWalkGeometry = null;

    if (DEBUG_TILES || (baseOptions && baseOptions.drawBorders)) {
      const outlineShape = new Shape();

      const anchorX = TILE_SIZE / 2;
      const anchorY = TILE_SIZE / 2;

      outlineShape.moveTo(anchorX, anchorY);
      outlineShape.lineTo(anchorX, -anchorY);
      outlineShape.lineTo(-anchorX, -anchorY);
      outlineShape.lineTo(-anchorX, anchorY);
      outlineShape.lineTo(anchorY, anchorY);

      const mesh = new Line(
        new BufferGeometry().setFromPoints(outlineShape.getPoints()),
        new LineBasicMaterial({ color: 0xFF0000 })
      );

      const circle = new Mesh(
        new CircleGeometry(0.25),
        new MeshBasicMaterial({ color: 0xFF0000, side: DoubleSide })
      );

      circle.position.y -= (TILE_SIZE / 2) - 1;

      mesh.position.y += 0.1;
      circle.position.x += 0.1;

      this.add(circle);
      this.add(mesh);
    }

    /** @type {Array<Lane>} */
    this._ownLanes = [];

    /** @type {Object.<TileOrientation, TileSideLanes?>} */
    this._lanes = {
      '0': null,
      '-1': null,
      '1': null,
      '2': null
    };
  }

  addDecorations(models, options, inner = false) {
    const opt = extractDecorationOptions(this._type, options);
    for (const [ location, o ] of Object.entries(opt)) {
      if (!o) {
        continue;
      }

      this.addDecoration(models, location, o, inner);
    }
  }

  addDecoration(models, location, options, inner = false) {
    assert(location === 'bottomLeft' || location === 'topLeft' || location === 'topRight');
    assert(options.type === 'bench' || options.type === 'trashcan');

    const rot = typeof options.rotation === 'number' ? options.rotation : 0;

    const obj = models[`${options.type}${options.target ? 'Target' : ''}`].clone();

    obj.rotation.x = Math.PI;
    obj.rotation.z = options.type === 'bench'
      ? (inner ? Math.PI : -Math.PI / 2)
      : (inner ? 0 : Math.PI / 2);

    obj.rotation.z += rot * (Math.PI / 2);

    if (location === 'bottomLeft') {
      obj.position.x -= 6;
      obj.position.y += 3;
    } else if (location === 'topLeft') {
      if (inner) {
        obj.position.x -= 6;
        obj.position.y -= 3;
      } else {
        obj.position.x += 3;
        obj.position.y -= 6;
      }
    } else if (location === 'topRight') {
      obj.position.x -= 3;
      obj.position.y -= 6;
    }

    obj.castShadow = true;
    obj.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });

    obj.updateWorldMatrix(true, false);
    obj.matrixAutoUpdate = false;

    this.add(obj);
  }

  addSign(models, type, side, options) {
    const sign = models.sign.clone();

    sign.traverse(child => {
      if (!child.isMesh) {
        return;
      }

      child.castShadow = true;

      if (child.name === 'Poller') {
        return;
      }

      if (type === 'PriorityRoad' && child.name !== 'Vorfahrtsstra\u00dfe') {
        child.visible = false;
      }

      if (type === 'Stop' && child.name !== 'Stoppschild') {
        child.visible = false;
      }

      if (type === 'Yield' && child.name !== 'VorfahrtAchten') {
        child.visible = false;
      }

      if (type === 'PriorityAtNext' && child.name !== 'Achtung') {
        child.visible = false;
      }

      if (type === 'Target' && child.name !== 'Sign_Target') {
        child.visible = false;
      }
    });

    sign.castShadow = true;

    sign.rotation.z = -1 * (Math.PI / 2) * side;
    sign.rotation.x += Math.PI;

    if (side === 0 || side === 2) {
      sign.position.x = (side === 0) ? -5 : 5;
      sign.position.y = (side === 0 ? -7.5 : 7.5);
    } else {
      sign.position.x = (side === -1) ? -7.5 : 7.5;
      sign.position.y = (side === -1 ? 5 : -5);
    }

    sign.updateWorldMatrix(true, false);
    sign.matrixAutoUpdate = false;

    this.add(sign);
  }

  laneGeometry() {
    return this._laneGeometry || null;
  }

  sideWalkGeometry() {
    return this._sideWalkGeometry || null;
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
    return 40;
  }

  /** @returns {Array<0 | 1 | 2 | -1>} */
  entranceSides() {
    return [];
  }

  /** @returns {Array<0 | 1 | 2 | -1>} */
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
    this._group.position.y = 0.01;
    this._group.rotation.z = this._rotation * (Math.PI / 2);
    this._group.rotation.x = Math.PI / 2;
  }
}

class RoadTile extends Tile {
  constructor(rotation, { models, drawBorders }, options) {
    super(TYPES.ROAD, rotation, { drawBorders });

    const { full, street, sidewalk } = adaptStreetObject(models.streetStraight);
    full.rotation.z += Math.PI / 2;

    street.updateWorldMatrix(true, false);
    sidewalk.updateWorldMatrix(true, false);

    this._laneGeometry = street.geometry.clone();
    this._laneGeometry.scale(-1, 1, 1);
    this._laneGeometry.applyMatrix4(street.matrixWorld);

    this._sideWalkGeometry = sidewalk.geometry.clone();
    this._sideWalkGeometry.applyMatrix4(sidewalk.matrixWorld);

    this.addDecorations(models, options, true);

    if (options.signs) {
      for (const { type, side, options: signOptions } of options.signs) {
        this.addSign(models, type, side, signOptions || {});
      }
    }
  }

  /** @returns {Array<0 | 1 | 2 | -1>} */
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
  constructor(rotation, { models, drawBorders }, options) {
    super(TYPES.CURVE, rotation, { drawBorders });

    const { street, sidewalk } = adaptStreetObject(models.streetCurve);

    street.updateWorldMatrix(true, false);
    sidewalk.updateWorldMatrix(true, false);

    this._laneGeometry = street.geometry.clone();
    this._laneGeometry.scale(1, 1, -1);
    this._laneGeometry.applyMatrix4(street.matrixWorld);

    this._sideWalkGeometry = sidewalk.geometry.clone();
    this._sideWalkGeometry.applyMatrix4(sidewalk.matrixWorld);

    if (options.signs) {
      for (const { type, side, options: signOptions } of options.signs) {
        this.addSign(models, type, side, signOptions || {});
      }
    }
  }

  /** @returns {Array<0 | 1 | 2 | -1>} */
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

    const { street, sidewalk } = adaptStreetObject(models.streetTCross);

    street.updateWorldMatrix(true, false);
    sidewalk.updateWorldMatrix(true, false);

    this._laneGeometry = street.geometry.clone();
    this._laneGeometry.scale(-1, 1, 1);
    this._laneGeometry.applyMatrix4(street.matrixWorld);

    this._sideWalkGeometry = sidewalk.geometry.clone();
    this._sideWalkGeometry.applyMatrix4(sidewalk.matrixWorld);

    this.addDecorations(models, options, true);

    if (options.signs) {
      for (const { type, side, options: signOptions } of options.signs) {
        this.addSign(models, type, side, signOptions || {});
      }
    }
  }

  /** @returns {Array<0 | 1 | 2 | -1>} */
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

class CrossTile extends Tile {
  constructor(rotation, { models, drawBorders }, options) {
    super(TYPES.CROSS, rotation, { drawBorders });

    const { street, sidewalk } = adaptStreetObject(models.streetCross);

    street.updateWorldMatrix(true, false);
    sidewalk.updateWorldMatrix(true, false);

    this._laneGeometry = street.geometry.clone();
    this._laneGeometry.scale(-1, 1, 1);
    this._laneGeometry.applyMatrix4(street.matrixWorld);

    this._sideWalkGeometry = sidewalk.geometry.clone();
    this._sideWalkGeometry.applyMatrix4(sidewalk.matrixWorld);

    if (options.signs) {
      for (const { type, side, options: signOptions } of options.signs) {
        this.addSign(models, type, side, signOptions || {});
      }
    }
  }

  /** @returns {Array<0 | 1 | 2 | -1>} */
  entranceSides() {
    return [ -1, 0, 1, 2 ];
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
      const ang = angle(from, to);
      assert(ang === 1 || ang === -1);

      let rotation;
      if (ang === 1) { // left turn
        rotation = rotate(from, -1);
      } else { // right turn
        rotation = rotate(from, 2);
      }
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

class ForestTile extends Tile {
  constructor(rotation, { models, drawBorders }, options) {
    super(TYPES.FOREST, rotation, { drawBorders });

    const rnd = new RandomGen(options.seed || 13);
    // const hasSideDecoration = options.bench && options.trashCan;

    this._forestGeometries = getForestGeometriesCached(rnd.integer(0, 10000), models);

    this.addDecorations(models, options, false);
  }

  getForestGeometry() {
    return this._forestGeometries;
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
      if (!child.isMesh) {
        return;
      }

      if (child.name.indexOf('Surrounding') !== -1) {
        child.visible = false;
      } else {
        child.castShadow = true;
      }
    });

    house.castShadow = true;
    house.receiveShadow = true;

    house.updateWorldMatrix(true, false);
    house.matrixAutoUpdate = false;

    this.add(house);

    this.addDecorations(models, options, false);
  }
}

class PlainTile extends Tile {
  constructor(rotation, { drawBorders, models }, options) {
    super(TYPES.PLAIN, rotation, { drawBorders });

    this.addDecorations(models, options, false);
  }
}

const TILE_BY_TYPE = {
  [TYPES.PLAIN]: PlainTile,
  [TYPES.ROAD]: RoadTile,
  [TYPES.CURVE]: CurveTile,
  [TYPES.T_SECTION]: TSectionTile,
  [TYPES.CROSS]: CrossTile,

  [TYPES.FOREST]: ForestTile,

  [TYPES.HOUSE]: HouseTile
};

export {
  Tile,
  PlainTile,
  RoadTile,
  CurveTile,
  TSectionTile,
  CrossTile,
  ForestTile,
  HouseTile
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
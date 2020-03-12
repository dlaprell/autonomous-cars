import * as THREE from 'three';

import { rotate, normalizeRotation } from './utils';

const DEBUG_TILES = true;
const DEBUG_MOVEMENT = true;

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

    const laneMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(LANE_WIDTH * 2, TILE_SIZE, 2, 2),
      roadMaterial
    );
  
    const centerLineMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(LINE_WIDTH, TILE_SIZE, 2, 2),
      lineMaterial
    );
  
    const leftLineMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(LINE_WIDTH, TILE_SIZE, 2, 2),
      lineMaterial
    );
    leftLineMesh.position.x -= (LINE_WIDTH / 2) + LANE_WIDTH;
  
    const rightLineMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(LINE_WIDTH, TILE_SIZE, 2, 2),
      lineMaterial
    );
    rightLineMesh.position.x += (LINE_WIDTH / 2) + LANE_WIDTH;

    this.add(laneMesh);

    const lineGroup = new THREE.Group();
    lineGroup.add(centerLineMesh);
    lineGroup.add(leftLineMesh);
    lineGroup.add(rightLineMesh);
    lineGroup.position.y = 0.02;
  
    this.add(lineGroup);
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

    const isVert = from === 0 || from === 2;
    const isInv = from === 2 || from === 1;

    // now derive angle, x, y from it

    const centerOfLane = (TILE_SIZE / 2) - (LANE_WIDTH / 2) + ((isInv ^ !isVert) ? LANE_WIDTH : 0);
    const pos = isInv ? TILE_SIZE - distance : distance;

    return {
      x: isVert ? centerOfLane : pos,
      y: isVert ? pos : centerOfLane,
      angle: rotate(this._rotation, isInv ? 2 : 0) * (Math.PI / 2),
      overshoot: Math.max(0, distance - TILE_SIZE)
    };
  }
}

class CurveTile extends Tile {
  constructor(rotation) {
    super(TYPES.CURVE, rotation);
  
    const curvedGeometry = this._getOutlineGeometry(
      TILE_SIZE / 2 + LANE_WIDTH,
      TILE_SIZE / 2 - LANE_WIDTH
    );
    const curveMesh = new THREE.Mesh(curvedGeometry, roadMaterial);
  
    const centerLineGeometry = this._getOutlineGeometry(
      (TILE_SIZE / 2) - (LINE_WIDTH / 2),
      (TILE_SIZE / 2) + (LINE_WIDTH / 2)
    );
    const centerLineMesh = new THREE.Mesh(centerLineGeometry, lineMaterial);
  
    const outerLineGeometry = this._getOutlineGeometry(
      (TILE_SIZE / 2) + LANE_WIDTH + LINE_WIDTH,
      (TILE_SIZE / 2) + LANE_WIDTH
    );
    const outerLineMesh = new THREE.Mesh(outerLineGeometry, lineMaterial);
  
    const innerLineGeometry = this._getOutlineGeometry(
      (TILE_SIZE / 2) - LANE_WIDTH - LINE_WIDTH,
      (TILE_SIZE / 2) - LANE_WIDTH
    );
    const innerLineMesh = new THREE.Mesh(innerLineGeometry, lineMaterial);

    this.add(curveMesh);

    const lineGroup = new THREE.Group();
    lineGroup.add(centerLineMesh);
    lineGroup.add(outerLineMesh);
    lineGroup.add(innerLineMesh);
    lineGroup.position.y = 0.02;
  
    this.add(lineGroup);
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

    // First invert the rotation, then rotate the from accordingly
    // -> rotFrom is now either 1 or 2
    const rotFrom = rotate(from, -this._rotation);

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

    const dirAngle = -movAngle + (Math.PI / 2) * (rotFrom === 2 ? 1 : -1);

    const xRef = TILE_SIZE + (movRadius * Math.sin(movAngle));
    const yRef = TILE_SIZE - (movRadius * Math.cos(movAngle));

    // Now rotate the coordinates back
    let x = xRef;
    let y = yRef;
    let angle = dirAngle;

    if (this._rotation === -1) {
      x = yRef;
      y = TILE_SIZE - xRef;
      angle -= (Math.PI / 2);
    } else if (this._rotation === 1) {  
      x = TILE_SIZE - yRef;
      y = xRef;
      angle -= (Math.PI / 2)
    } else if (this._rotation === 2) {
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
}

class TSectionTile extends Tile {
  constructor(rotation) {
    super(TYPES.T_SECTION, rotation);

    const laneMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(LANE_WIDTH * 2, TILE_SIZE),
      roadMaterial
    );
  
    const halfMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(TILE_SIZE / 2 - LANE_WIDTH, LANE_WIDTH * 2),
      roadMaterial
    );
    halfMesh.position.x += (TILE_SIZE / 2 - LANE_WIDTH) / 2 + LANE_WIDTH;
  
    const leftLineMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(LINE_WIDTH, TILE_SIZE),
      lineMaterial
    );
    leftLineMesh.position.x -= (LINE_WIDTH / 2) + LANE_WIDTH;
  
    const rightTopLineMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(LINE_WIDTH, TILE_SIZE / 2 - LANE_WIDTH),
      lineMaterial
    );
    rightTopLineMesh.position.x += (LINE_WIDTH / 2) + LANE_WIDTH;
    rightTopLineMesh.position.y += (TILE_SIZE / 2 - LANE_WIDTH) / 2 + LANE_WIDTH;
  
    const centerTopLineMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(LINE_WIDTH, TILE_SIZE / 2 - LANE_WIDTH),
      lineMaterial
    );
    centerTopLineMesh.position.x += (LINE_WIDTH / 2);
    centerTopLineMesh.position.y += (TILE_SIZE / 2 - LANE_WIDTH) / 2 + LANE_WIDTH;
  
    const rightBottomLineMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(LINE_WIDTH, TILE_SIZE / 2 - LANE_WIDTH),
      lineMaterial
    );
    rightBottomLineMesh.position.x += (LINE_WIDTH / 2) + LANE_WIDTH;
    rightBottomLineMesh.position.y -= (TILE_SIZE / 2 - LANE_WIDTH) / 2 + LANE_WIDTH;
  
    const centerBottomLineMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(LINE_WIDTH, TILE_SIZE / 2 - LANE_WIDTH),
      lineMaterial
    );
    centerBottomLineMesh.position.x += (LINE_WIDTH / 2);
    centerBottomLineMesh.position.y -= (TILE_SIZE / 2 - LANE_WIDTH) / 2 + LANE_WIDTH;
  
    const armCenterLineMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(TILE_SIZE / 2 - LANE_WIDTH, LINE_WIDTH),
      lineMaterial
    );
    armCenterLineMesh.position.x += (TILE_SIZE / 2 - LANE_WIDTH) / 2 + LANE_WIDTH;
  
    const armTopLineMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(TILE_SIZE / 2 - LANE_WIDTH, LINE_WIDTH),
      lineMaterial
    );
    armTopLineMesh.position.x += (TILE_SIZE / 2 - LANE_WIDTH) / 2 + LANE_WIDTH;
    armTopLineMesh.position.y -= LANE_WIDTH - (LINE_WIDTH / 2);
  
    const armBottomLineMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(TILE_SIZE / 2 - LANE_WIDTH, LINE_WIDTH),
      lineMaterial
    );
    armBottomLineMesh.position.x += (TILE_SIZE / 2 - LANE_WIDTH) / 2 + LANE_WIDTH;
    armBottomLineMesh.position.y += LANE_WIDTH - (LINE_WIDTH / 2);

    this.add(laneMesh);
    this.add(halfMesh);

    const lineGroup = new THREE.Group();
    lineGroup.add(leftLineMesh);
    lineGroup.add(rightTopLineMesh);
    lineGroup.add(rightBottomLineMesh);
    lineGroup.add(centerBottomLineMesh);
    lineGroup.add(centerTopLineMesh);
    lineGroup.add(armCenterLineMesh);
    lineGroup.add(armTopLineMesh);
    lineGroup.add(armBottomLineMesh);
    lineGroup.position.y = 0.02;
  
    this.add(lineGroup);
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

  _interpolerateMovementStraight(from, to, distance) {
    const isVert = from === 0 || from === 2;
    const isInv = from === 2 || from === 1;

    // now derive angle, x, y from it

    const centerOfLane = (TILE_SIZE / 2) - (LANE_WIDTH / 2) + ((isInv ^ !isVert) ? LANE_WIDTH : 0);
    const pos = isInv ? TILE_SIZE - distance : distance;

    return {
      x: isVert ? centerOfLane : pos,
      y: isVert ? pos : centerOfLane,
      angle: rotate(this._rotation, isInv ? 2 : 0) * (Math.PI / 2),
      overshoot: Math.max(0, distance - TILE_SIZE)
    };
  }

  _interpolerateMovementCurve(from, to, distance, rotation) {
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

    const dirAngle = -movAngle + (Math.PI / 2) * (rotFrom === 2 ? 1 : -1);

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
      angle -= (Math.PI / 2)
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

      return this._interpolerateMovementCurve(
        from,
        to,
        distance,
        rotation
      );
    } else {
      return this._interpolerateMovementStraight(from, to, distance);
    }
  }
}

const TILE_BY_TYPE = {
  [TYPES.PLAIN]: Tile,
  [TYPES.ROAD]: RoadTile,
  [TYPES.CURVE]: CurveTile,
  [TYPES.T_SECTION]: TSectionTile
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
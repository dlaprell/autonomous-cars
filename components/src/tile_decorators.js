import { Group, MeshBasicMaterial, Mesh, PlaneGeometry, DoubleSide } from 'three';

import {
  TYPES,
  
  TILE_SIZE,
  LANE_WIDTH,
  PAVEMENT_WIDTH,
  LINE_WIDTH,

  calculateCurveGeometry
} from './grid_tiles';

const SIGN_OFFSET_MID = LANE_WIDTH + PAVEMENT_WIDTH + 0.5;
const SIGN_OFFSET_SIDE = TILE_SIZE - SIGN_OFFSET_MID;

const DECORATOR_TYPES = {
  PAVEMENT: 'pavement',
  SIGN: 'sign',
  STREET_LIGHTS: 'street_lights'
};

const pavementMaterial = new MeshBasicMaterial({ color: 0xa60000, side: DoubleSide });

class TileDecoration {
  constructor(tile, options) {
    this._tile = tile;
    this._options = options;
  }

  options() {
    return this._options;
  }

  tile() {
    return this._tile;
  }

  render(group) {
    throw new Error('Render method not implemented');
  }
}

class PavementDecorator extends TileDecoration {
  constructor(tile, options) {
    super(tile, options);

    // Depending on the tile that we have, we have to add multiple pavement objects
    this._elements = [];

    this.renderInnerCurvePavement(false);
  }

  renderFullLengthSidePavement(left) {
    const pavMesh = new Mesh(
      new PlaneGeometry(PAVEMENT_WIDTH, TILE_SIZE),
      pavementMaterial
    );

    pavMesh.position.x += (TILE_SIZE / 2) + (left ? -1 : 1) * (LANE_WIDTH + LINE_WIDTH + PAVEMENT_WIDTH / 2);
    pavMesh.position.z += TILE_SIZE / 2;
    
    pavMesh.position.y += 0.05;
    pavMesh.rotation.x = Math.PI / 2;

    this._elements.push(pavMesh);
  }

  renderOuterCurvePavement() {

  }

  renderInnerCurvePavement(left, top) {
    // For the curve shape the anchor point is the bottom right corner of a tile
    const outerRadius = (TILE_SIZE / 2) - (LANE_WIDTH + LINE_WIDTH);
    const innerRadius = outerRadius - PAVEMENT_WIDTH;

    const curShape = calculateCurveGeometry(outerRadius, innerRadius);
    const curMesh = new Mesh(curShape, pavementMaterial);

    // Move to the bottom right corner
    curMesh.position.x += TILE_SIZE / 2;
    curMesh.position.z += TILE_SIZE / 2;

    // r

    curMesh.position.y += 0.05;
    curMesh.rotation.x = Math.PI / 2;

    this._elements.push(curMesh);
  }

  render(group) {
    for (const e of this._elements) {
      group.add(e);
    }
  }
}

const DECORATOR_ELEMENTS = {
  [DECORATOR_TYPES.PAVEMENT]: PavementDecorator,
  // [DECORATOR_TYPES.SIGN]: SignDecorator,
  // [DECORATOR_TYPES.STREET_LIGHTS]: StreetLightDecorator
};

class TileDecorator {
  constructor(tile, decorations) {
    this._tile = tile;
    this._decorations = decorations
      .map(({ type, ...rest }) => {
        const constr = DECORATOR_ELEMENTS[type];

        return new constr(tile, rest);
      });
  }

  render() {
    // For now just assume that we are a plain road
    const group = new Group();

    // group.position.x -= TILE_SIZE / 2;
    // group.position.z -= TILE_SIZE / 2;

    for (const dec of this._decorations) {
      dec.render(group);
    }

    return group;
  }
}

export {
  DECORATOR_TYPES,

  TileDecorator
};
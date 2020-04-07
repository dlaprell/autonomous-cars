import * as THREE from 'three';

import {
  TYPES,
  TILE_BY_TYPE,

  TILE_SIZE
} from './grid_tiles';
import { TileDecorator, DECORATOR_TYPES } from './tile_decorators';

const MAP = [
  [
    [ TYPES.CURVE, 0 ],
    [ TYPES.ROAD, 1 ],
    [ TYPES.ROAD, 1 ],
    [ TYPES.T_SECTION, 1 ],
    [ TYPES.ROAD, 1 ],
    [ TYPES.T_SECTION, 1 ],
    [ TYPES.ROAD, 1 ],
    [ TYPES.CURVE, 1 ],
  ],
  [
    [ TYPES.ROAD, 0 ],
    [ TYPES.CURVE, 0 ],
    [ TYPES.ROAD, 1 ],
    [ TYPES.T_SECTION, 2 ],
    [ TYPES.TREE, 0 ],
    [ TYPES.ROAD, 0 ],
    [ TYPES.PLAIN, 0 ],
    [ TYPES.ROAD, 0 ]
  ],
  [
    [ TYPES.T_SECTION, 0 ],
    [ TYPES.CURVE, 2 ],
    [ TYPES.TREE, 0 ],
    [ TYPES.T_SECTION, 0 ],
    [ TYPES.ROAD, 1 ],
    [ TYPES.T_SECTION, 2 ],
    [ TYPES.TREE, 0 ],
    [ TYPES.ROAD, 0 ]
  ],
  [
    [ TYPES.T_SECTION, 0 ],
    [ TYPES.ROAD, 1 ],
    [ TYPES.ROAD, 1 ],
    [ TYPES.CURVE, 2 ],
    [ TYPES.TREE, 0 ],
    [ TYPES.ROAD, 0 ],
    [ TYPES.PLAIN, 0 ],
    [ TYPES.ROAD, 0 ]
  ],
  [
    [ TYPES.ROAD, 0 ],
    [ TYPES.TREE, 0 ],
    [ TYPES.TREE, 0 ],
    [ TYPES.TREE, 0 ],
    [ TYPES.TREE, 0 ],
    [ TYPES.ROAD, 0 ],
    [ TYPES.TREE, 0 ],
    [ TYPES.ROAD, 0 ]
  ],
  [
    [ TYPES.CURVE, -1 ],
    [ TYPES.ROAD, 1 ],
    [ TYPES.ROAD, 1 ],
    [ TYPES.T_SECTION, 1 ],
    [ TYPES.ROAD, 1 ],
    [ TYPES.CURVE, 2 ],
    [ TYPES.TREE, 0 ],
    [ TYPES.ROAD, 0 ]
  ],
  [
    [ TYPES.TREE, 0 ],
    [ TYPES.TREE, 0 ],
    [ TYPES.TREE, 0 ],
    [ TYPES.ROAD, 0 ],
    [ TYPES.TREE, 0 ],
    [ TYPES.TREE, 0 ],
    [ TYPES.TREE, 0 ],
    [ TYPES.ROAD, 0 ]
  ],
  [
    [ TYPES.TREE, 0 ],
    [ TYPES.TREE, 0 ],
    [ TYPES.TREE, 0 ],
    [ TYPES.CURVE, -1 ],
    [ TYPES.ROAD, 1 ],
    [ TYPES.ROAD, 1 ],
    [ TYPES.ROAD, 1 ],
    [ TYPES.CURVE, 2 ]
  ]
];

const GRID_TILE_WIDTH = MAP.length; // Tile map 6 x 6
const GRID_SIZE = TILE_SIZE * GRID_TILE_WIDTH;

class GridMap {
  constructor(rd, models) {
    this._tileList = [];
    this._map = MAP
      .map(
        (row, x) => row.map(
          ([ type, rotation ], y) => {
            const tile = TILE_BY_TYPE[type];
            const data = {
              x,
              y,
              tile: new tile(rotation, { random: rd, models })
            };

            this._tileList.push(data);

            return data;
          }
        )
      );

    this._initLanes();

    this._group = new THREE.Group();
  }

  _initLanes() {
    const visited = new Set();
    let front = new Set([ 0, 0 ]);

    while (front.size > 0) {
      const f = front;
      front = new Set();

      for (const [ x, y ] of f) {
        const { tile } = this.getTileAt(x, y);

        if (tile.entranceSides().length === 0) {
          continue;
        }

        // First assign only lanes to the road and curve sections
        if (tile.getType() === TYPES.ROAD || tile.getType() === TYPES.CURVE) {
          if (tile._ownLanes.length !== 0) {
            // So either we find a connecting tile to the left or the top, otherwise
            // we cannot find a lane and have to add a newly created one.
            // Note: in the case of a curve, we can also connect two previously existing
            //       lanes that should now be connected

            for (const side of tile.entranceSides()) {
              if (side !== 0 && side !== -1) {
                continue;
              }

              
            }
          }
        }
      }
    }

  }

  getGroup() {
    return this._group;
  }

  size() {
    return GRID_SIZE;
  }

  getDirectionFor(xA, yA, xB, yB) {
    const d = Math.abs(xA - xB) + Math.abs(yA - yB);
    if (d != 1) {
      throw new Error('Tiles not adjacent');
    }

    if (xB < xA) {
      return -1;
    }

    if (yB < yA) {
      return 0;
    }

    if (xB > xA) {
      return 1;
    }

    return 2;
  }

  getTileAt(x, y) {
    return this._map[y][x];
  }

  getRelativeFrom(x, y, dir, steps = 1) {
    // const anchor = this.getTileAt(x, y);
    steps *= (dir === 0 || dir === -1) ? -1 : 1;

    if (dir === 0 || dir === 2) {
      y += steps;
    } else {
      x += steps;
    }

    return [ x, y ];
  }

  getTileAnchorPosition(x, y) {
    return [
      -1 * (GRID_SIZE / 2) + (x * TILE_SIZE),
      -1 * (GRID_SIZE / 2) + (y * TILE_SIZE)
    ];
  }

  render() {
    for (const { x, y, tile } of this._tileList) {
      tile.render();
      const g = tile.getGroup();

      g.position.x += -1 * (GRID_SIZE / 2) + (y * TILE_SIZE);
      g.position.z += -1 * (GRID_SIZE / 2) + (x * TILE_SIZE);

      this._group.add(g);

      if (x === 0 && y === 0) {
        const dec = new TileDecorator(tile, [
          { type: DECORATOR_TYPES.PAVEMENT }
        ]);
        const g = dec.render();
        g.position.x += -1 * (GRID_SIZE / 2) + (x * TILE_SIZE);
        g.position.z += -1 * (GRID_SIZE / 2) + (y * TILE_SIZE);

        this._group.add(g);
      }
    }
  }
}

function initTiles(rd, models) {
  return new GridMap(rd, models);
}

export {
  GRID_SIZE,

  initTiles
};
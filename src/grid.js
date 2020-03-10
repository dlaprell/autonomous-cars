import * as THREE from 'three';

import { TYPES, TILE_BY_TYPE } from './grid_tiles';

const MAP = [
  [ [ TYPES.CURVE, 0 ], [ TYPES.T_SECTION, 1 ], [ TYPES.ROAD, 1 ], [ TYPES.ROAD, -1 ] ],
  [ [ TYPES.ROAD, 0 ], [ TYPES.ROAD, 0 ], [ TYPES.PLAIN, 1 ], [ TYPES.CURVE, 2 ] ],
  [ [ TYPES.ROAD, 0 ], [ TYPES.PLAIN, 1 ], [ TYPES.ROAD, 0 ], [ TYPES.ROAD, 0 ] ],
  [ [ TYPES.ROAD, 1 ], [ TYPES.ROAD, 1 ], [ TYPES.T_SECTION, 1 ], [ TYPES.CURVE, 2 ] ]
];

class GridMap {
  constructor() {
    this._tileList = [];
    this._map = MAP
      .map(
        (row, x) => row.map(
          ([ type, rotation ], y) => {
            const tile = TILE_BY_TYPE[type];
            const data = {
              x,
              y,
              tile: new tile(rotation)
            };

            this._tileList.push(data);
          }
        )
      );

    this._group = new THREE.Group();
  }

  getGroup() {
    return this._group;
  }

  render() {
    for (const { x, y, tile } of this._tileList) {
      tile.render(x, y);

      this._group.add(tile.getGroup());
    }
  }
}

function initTiles() {
  return new GridMap();
}

export {
  initTiles
};
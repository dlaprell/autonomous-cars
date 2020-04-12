import * as THREE from 'three';

import {
  TYPES,
  TILE_BY_TYPE,

  TILE_SIZE
} from './grid_tiles';
import { TileDecorator, DECORATOR_TYPES } from './tile_decorators';
import { rotate } from './utils';
import { Lane } from './lane';
import { assert } from '../utils/assert';

let gridIdCounter = 0;

class GridMap {
  constructor(rd, models, { withLanes, baseMap }) {
    this._id = ++gridIdCounter;

    this._tileList = [];
    this._map = baseMap
      .map(
        (row, y) => row.map(
          ([ type, rotation, options ], x) => {
            const tile = TILE_BY_TYPE[type];
            const data = {
              x,
              y,
              tile: new tile(rotation, { random: rd, models }, options || {})
            };

            data.tile._x = x;
            data.tile._y = y;

            this._tileList.push(data);

            return data;
          }
        )
      );

    if (withLanes) {
      this._initLanes();
    }

    this._group = new THREE.Group();
  }

  id () {
    return this._id;
  }

  _initLanes() {
    let front = [ [ 0, 0 ] ];

    while (front.length > 0) {
      const f = front;
      front = [];

      for (const [ x, y ] of f) {
        const { tile } = this.getTileAt(x, y);

        if (x + 1 < this.dimension()) {
          front.push([ x + 1, y ]);
        }

        if (y + 1 < this.dimension() && x == 0) {
          front.push([ x, y + 1 ]);
        }

        if (tile.entranceSides().length === 0) {
          continue;
        }

        const top = y === 0 ? null : this.getTileAt(x, y - 1).tile;
        const left = x === 0 ? null : this.getTileAt(x - 1, y).tile;

        const topConnect = top !== null ? top._lanes['2'] : null;
        const leftConnect = left !== null ? left._lanes['1'] : null;

        if (tile.getType() === TYPES.CURVE) {
          if (tile.getRotation() === 0) {
            // So one special rotation is the 0 rotation that will have to create two new lanes
            const l1 = new Lane();
            const l2 = new Lane();
            
            tile._ownLanes.push(l1, l2);

            tile._lanes['1'] = {
              incoming: l1,
              outgoing: l2
            };

            tile._lanes['2'] = {
              outgoing: l1,
              incoming: l2
            };

            l1._includedTiles.add(tile);
            l2._includedTiles.add(tile);

            continue;
          } else if (tile.getRotation() === 2) {
            // So another special rotation is the 2 rotation -> it connects two lanes
            assert(topConnect);
            assert(leftConnect);

            const { incoming: t_i, outgoing: t_o } = topConnect;
            const { incoming: l_i, outgoing: l_o } = leftConnect;

            // Use the top lanes and let the left ones be absorbed
            t_i.absorb(l_o);
            t_o.absorb(l_i);

            t_i._includedTiles.add(tile);
            t_o._includedTiles.add(tile);

            tile._lanes['-1'] = {
              incoming: t_i,
              outgoing: t_o
            };
            tile._lanes['0'] = {
              outgoing: t_i,
              incoming: t_o
            };

            continue;
          }
        }

        const tileLaneSides = new Set(tile.entranceSides());
        const tileLaneEnding = (tile.getType() === TYPES.T_SECTION || tile.getType() === TYPES.CROSS);

        if (tileLaneSides.has(0)) {
          assert(topConnect);

          // So we have to connect the top one
          tile._lanes['0'] = {
            incoming: topConnect.outgoing,
            outgoing: topConnect.incoming,
          };

          if (tileLaneEnding) {
            topConnect.outgoing._adjacentTiles.add(tile);
            topConnect.incoming._adjacentTiles.add(tile);
          } else {
            tile._ownLanes.push(Object.values(topConnect));
          }
        }

        if (tileLaneSides.has(-1)) {
          assert(leftConnect);

          // So we have to connect the left one
          tile._lanes['-1'] = {
            incoming: leftConnect.outgoing,
            outgoing: leftConnect.incoming,
          };

          if (tileLaneEnding) {
            leftConnect.outgoing._adjacentTiles.add(tile);
            leftConnect.incoming._adjacentTiles.add(tile);
          } else {
            tile._ownLanes.push(Object.values(leftConnect));
          }
        }

        for (const side of [ 1, 2 ]) {
          if (!tileLaneSides.has(side)) {
            continue;
          }

          if (tile.getType() === TYPES.T_SECTION || tile.getType() === TYPES.CROSS) {
            // So we nevertheless have to create two new lanes
            const l1 = new Lane();
            const l2 = new Lane();
            
            l1._adjacentTiles.add(tile);
            l2._adjacentTiles.add(tile);

            tile._lanes[side] = {
              incoming: l1,
              outgoing: l2
            };
          } else if (tile.getType() === TYPES.ROAD || tile.getType() === TYPES.CURVE) {
            let connecting = null;
            
            if (tile.getType() === TYPES.ROAD) {
              connecting = side === 1 ? leftConnect : topConnect;
            } else {
              connecting = tile.entranceSides().find(s => s !== side) === -1 ? leftConnect : topConnect;
            }

            tile._lanes[side] = {
              incoming: connecting.incoming,
              outgoing: connecting.outgoing,
            };
          }
        }

        if (!tileLaneEnding) {
          for (const d of Object.values(tile._lanes)) {
            if (!d) {
              continue;
            }

            d.incoming._includedTiles.add(tile);
            d.outgoing._includedTiles.add(tile);
          }
        }
      }

      // Loop again over the grid and check the current ones
      for (const [ x, y ] of f) {
        const { tile } = this.getTileAt(x, y);

        const lanesOut = new Set();
        const lanesIn = new Set();

        const sides = tile.entranceSides();
        for (const side of sides) {
          assert(tile._lanes[side]);
          assert(tile._lanes[side].incoming);
          assert(tile._lanes[side].outgoing);

          lanesIn.add(tile._lanes[side].incoming);
          lanesOut.add(tile._lanes[side].outgoing);
        }

        if (tile.getType() == TYPES.T_SECTION || tile.getType() == TYPES.CROSS) {
          continue;
        }

        // Check that there is for every lane an incoming and an outgoing end
        // if this tile is not a t-section
        assert(lanesIn.size === lanesOut.size);

        for (const lane of lanesIn) {
          assert(lanesOut.has(lane));
        }
      }
    }

    const lanes = new Set();
    const xyTile = new Map();

    for (const { x, y, tile } of this._tileList) {
      for (const side of tile.entranceSides()) {
        const [ nX, nY ] = this.getRelativeFrom(x, y, side);
        const { tile: neighbor } = this.getTileAt(nX, nY);

        assert(tile._lanes[side].incoming === neighbor._lanes[rotate(side, 2)].outgoing);
        assert(tile._lanes[side].outgoing === neighbor._lanes[rotate(side, 2)].incoming);

        lanes.add(tile._lanes[side].incoming);
        lanes.add(tile._lanes[side].outgoing);
      }

      xyTile.set(tile, [ x, y ]);
    }

    for (const lane of lanes) {
      const tileOrder = [];

      const tileDistance = [];
      let from = null;

      if (lane._includedTiles.size === 0) {
        continue;
      }

      let tile = lane._includedTiles.values().next().value;
      for (;;) {
        assert(tile._lanes);

        const end = Object
          .entries(tile._lanes)
          .find(([ _, ends ]) => ends && ends.incoming === lane);

        assert(end);

        const [ x, y ] = xyTile.get(tile);
        const [ nX, nY ] = this.getRelativeFrom(x, y, Number(end[0]));

        const { tile: next } = this.getTileAt(nX, nY);

        if (next.getType() === TYPES.T_SECTION || next.getType() === TYPES.CROSS) {
          from = rotate(end[0], 2);
          break;
        }

        tile = next;
      }

      let totalLaneDistance = 0;

      // Now follow the lane to the end
      for (;;) {
        tileOrder.push(tile);

        assert(tile._lanes);

        const end = Object
          .entries(tile._lanes)
          .find(([ _, ends ]) => ends && ends.outgoing === lane);

        assert(end);
        const side = Number(end[0]);

        const d = tile.getTotalDistance(from, side);

        totalLaneDistance += d;
        tileDistance.push(d);
        from = rotate(side, 2);

        const [ x, y ] = xyTile.get(tile);
        const [ nX, nY ] = this.getRelativeFrom(x, y, side);

        const { tile: next } = this.getTileAt(nX, nY);

        if (next.getType() === TYPES.T_SECTION || next.getType() === TYPES.CROSS) {
          break;
        }

        tile = next;
      }

      lane._includedTilesOrder = tileOrder;
      lane._includedTilesDistances = tileDistance;
      lane._totalDistance = totalLaneDistance;
    }
  }

  getGroup() {
    return this._group;
  }

  dimension() {
    return this._map.length;
  }

  size() {
    return this._map.length * TILE_SIZE;
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
    assert(dir === 0 || dir === 1 || dir === 2 || dir === -1);

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
      -1 * (this.size() / 2) + (x * TILE_SIZE),
      -1 * (this.size() / 2) + (y * TILE_SIZE)
    ];
  }

  computeTileFromPosition(x, y) {
    const tX = Math.floor((x + (this.size() / 2)) / TILE_SIZE);
    const tY = Math.floor((y + (this.size() / 2)) / TILE_SIZE);

    return [ tX, tY ];
  }

  render() {
    for (const { x, y, tile } of this._tileList) {
      tile.render();
      const g = tile.getGroup();

      g.position.x += -1 * (this.size() / 2) + (x * TILE_SIZE);
      g.position.z += -1 * (this.size() / 2) + (y * TILE_SIZE);

      this._group.add(g);

      if (x === 0 && y === 0 && false) {
        const dec = new TileDecorator(tile, [
          { type: DECORATOR_TYPES.PAVEMENT }
        ]);
        const g = dec.render();
        g.position.x += -1 * (this.size() / 2) + (x * TILE_SIZE);
        g.position.z += -1 * (this.size() / 2) + (y * TILE_SIZE);

        this._group.add(g);
      }
    }
  }
}

function initTiles(rd, models, options) {
  return new GridMap(rd, models, options);
}

export {
  initTiles
};
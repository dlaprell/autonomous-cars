// @ts-check

import {
  Group,
  Mesh,
  BoxBufferGeometry,

  MeshLambertMaterial,
  DoubleSide
} from 'three';

import { BufferGeometryUtils } from '../third-party/BufferGeometryUtils';
import { assert } from '../utils/assert';

import {
  TYPES,
  TILE_BY_TYPE,

  TILE_SIZE
} from './grid_tiles';
import { rotate, addColorToGeometry } from './utils';
import { Lane } from './lane';

/** @typedef {import('./grid_tiles').Tile} Tile */
/** @typedef {import('./grid_tiles').ForestTile} ForestTile */
/** @typedef {import('./grid_tiles').TileTypes} TileTypes */
/** @typedef {import('./grid_tiles').TileBaseData} TileBaseData */

/**
 * @typedef {Object} TileData
 * @property {number} x
 * @property {number} y
 * @property {number} generation
 * @property {Tile} tile
 * @property {TileBaseData} originalData
 */

const sideWalkMaterial = new MeshLambertMaterial({
  vertexColors: true,
  side: DoubleSide
});
const laneMaterial = new MeshLambertMaterial({
  vertexColors: true,
  side: DoubleSide
});
const sideWalkColor = '#7d3c00';
const laneColor = '#999999';

class GridMap {
  constructor(models, { withLanes, baseMap, creatorView }) {
    this._creatorView = creatorView;
    this._models = models;

    this._generation = 1;

    /** @type {Array<TileData>} */
    this._tileList = [];

    /** @type {Array<Array<TileData>>} */
    this._map;

    this._group = new Group();
    // this._group.receiveShadow = true;

    const cubeMaterial = new MeshLambertMaterial({ color: 0x77BBFF });
    cubeMaterial.transparent = true;
    cubeMaterial.opacity = 0.5;

    this._highlightCube = new Mesh(
      new BoxBufferGeometry(TILE_SIZE, TILE_SIZE, TILE_SIZE),
      cubeMaterial
    );
    this._highlightCube.visible = false;
    this._highlightCube.position.y += TILE_SIZE / 2;
    this._group.add(this._highlightCube);

    this.updateBaseMap(baseMap);

    if (withLanes && !creatorView) {
      this._initLanes();
    }
  }

  updateBaseMap(baseMap) {
    const curGeneration = this._generation++;

    /** @type {Array<TileData>} */
    const tileList = [];

    /** @type {Array<Array<TileData>>} */
    const updatedMap = baseMap
      .map(
        (row, y) => row.map(
          (originalData, x) => {
            const data = {
              x,
              y,

              generation: curGeneration,

              originalData
            };

            return data;
          }
        )
      );

    // Now diff the updatedMap against the current map
    for (let y = 0; y < updatedMap.length; y++) {
      this.updateRow(updatedMap[y], y);
    }

    // It is also possible, that the new map is smaller than the old one
    if (this._map && this._map.length > updatedMap.length) {
      for (let y = updatedMap.length; y < this._map.length; y++) {
        this.updateRow([], y);
      }
    }

    /** @type {Array<TileData & { tile: ForestTile }>} */
    const forestTiles = [];

    /** @type {Array<TileData>} */
    const laneTiles = [];

    // Collect all updated tiles
    for (let y = 0; y < updatedMap.length; y++) {
      for (let x = 0; x < updatedMap.length; x++) {
        tileList.push(updatedMap[y][x]);

        const data = updatedMap[y][x];
        if (data.tile.getType() === TYPES.FOREST) {
          // @ts-expect-error
          forestTiles.push(data);
        } else if (data.tile.laneGeometry()) {
          laneTiles.push(data);
        }
      }
    }

    // there are two basic modes that we have to support:
    // 1) merging all forest / lane geometries across all tiles
    // 2) Rendering them only to their own tile
    if (!this._creatorView) { // Mode 1
      // Note: in this mode, we can use the geometries in a one time fashion

      if (forestTiles.length > 0) {
        const forestGeometries = [];

        for (const { tile } of forestTiles) {
          const g = tile.getGroup();
          g.updateWorldMatrix(true, false);

          const forestGeometry = tile.getForestGeometry();
          forestGeometry.applyMatrix4(g.matrixWorld);

          forestGeometries.push(forestGeometry);
        }

        const mergedForests = BufferGeometryUtils.mergeBufferGeometries(forestGeometries, false);
        assert(mergedForests);
        const forests = new Mesh(mergedForests, new MeshLambertMaterial({ vertexColors: true }));
        forests.castShadow = true;
        forests.frustumCulled = false;
        forests.updateWorldMatrix(true, false);
        forests.matrixAutoUpdate = false;
        this._group.add(forests);
      }

      if (laneTiles.length > 0) {
        const laneGeometries = [];
        const sidewalkGeometries = [];

        for (const { tile } of laneTiles) {
          const g = tile.getGroup();
          g.updateWorldMatrix(true, false);

          const laneGeometry = tile.laneGeometry();
          laneGeometry.applyMatrix4(g.matrixWorld);

          const sidewalkGeometry = tile.sideWalkGeometry();

          laneGeometries.push(laneGeometry);
          if (sidewalkGeometry) {
            sidewalkGeometry.applyMatrix4(g.matrixWorld);
            sidewalkGeometries.push(sidewalkGeometry);
          }
        }

        const mergedLanes = BufferGeometryUtils.mergeBufferGeometries(laneGeometries, false);
        assert(mergedLanes);
        addColorToGeometry(mergedLanes, laneColor);
        const lanes = new Mesh(mergedLanes, laneMaterial);
        lanes.receiveShadow = true;
        lanes.frustumCulled = false;
        lanes.updateWorldMatrix(true, false);
        lanes.matrixAutoUpdate = false;
        this._group.add(lanes);

        const mergedSidewalks = BufferGeometryUtils.mergeBufferGeometries(sidewalkGeometries, false);
        assert(mergedSidewalks);
        addColorToGeometry(mergedSidewalks, sideWalkColor);
        const sideWalks = new Mesh(mergedSidewalks, sideWalkMaterial);
        sideWalks.receiveShadow = true;
        sideWalks.frustumCulled = false;
        sideWalks.updateWorldMatrix(true, false);
        sideWalks.matrixAutoUpdate = false;
        this._group.add(sideWalks);
      }
    } else { // Mode 2
      for (const { tile, generation } of forestTiles) {
        if (generation !== curGeneration) {
          continue;
        }

        const g = tile.getGroup();
        const forestGeometry = tile.getForestGeometry();
        const forestMesh = new Mesh(forestGeometry, new MeshLambertMaterial({ vertexColors: true }));
        forestMesh.castShadow = true;
        g.add(forestMesh);
      }

      for (const { tile, generation } of laneTiles) {
        if (generation !== curGeneration) {
          continue;
        }

        const g = tile.getGroup();
        const laneGeometry = tile.laneGeometry();
        addColorToGeometry(laneGeometry, laneColor);
        const laneMesh = new Mesh(laneGeometry, laneMaterial);
        laneMesh.receiveShadow = true;
        g.add(laneMesh);

        const sidewalkGeometry = tile.sideWalkGeometry();
        if (sidewalkGeometry) {
          addColorToGeometry(sidewalkGeometry, sideWalkColor);
          const sidewalkMesh = new Mesh(sidewalkGeometry, sideWalkMaterial);
          sidewalkMesh.receiveShadow = true;
          g.add(sidewalkMesh);
        }
      }
    }

    if (this._map && this._map.length !== updatedMap.length) {
      // So we need to reposition *every* tile so that they are correctly aligned
      // again

      const gridSize = updatedMap.length * TILE_SIZE;

      for (const { x, y, tile } of tileList) {
        const g = tile.getGroup();

        g.position.x = -1 * (gridSize / 2) + (x * TILE_SIZE) + TILE_SIZE / 2;
        g.position.z = -1 * (gridSize / 2) + (y * TILE_SIZE) + TILE_SIZE / 2;

        // These tile groups are static and need to be updated manually
        g.updateMatrix();
      }
    }

    this._map = updatedMap;
    this._tileList = tileList;
  }

  /**
   * @param {Array<TileData?>} row
   * @param {number} y
   */
  updateRow(row, y) {
    const oldRowExists = Boolean(this._map && this._map[y]);
    const length = oldRowExists ? Math.max(this._map[y].length, row.length) : row.length;

    for (let x = 0; x < length; x++) {
      const cur = oldRowExists ? this._map[y][x] : null;
      const upd = row[x] || null;

      if (cur && upd && cur.originalData === upd.originalData) {
        // We override the newly generated one since this one
        // is more up to date
        row[x] = cur;
        continue;
      }

      if (cur) {
        this.removeTile(cur);
      }

      if (upd) {
        const [ type, rotation, options ] = upd.originalData;
        const tile = TILE_BY_TYPE[type];

        upd.tile = new tile(
          rotation,
          { models: this._models, drawBorders: this._creatorView },
          options || {}
        );

        // @ts-expect-error
        upd.tile._x = x;

        // @ts-expect-error
        upd.tile._y = y;

        // Now add the new tile to the grid
        this.addTile(upd, row.length * TILE_SIZE);
      }
    }
  }

  addTile({ x, y, tile }, gridSize) {
    tile.render();
    const g = tile.getGroup();

    g.position.x = -1 * (gridSize / 2) + (x * TILE_SIZE) + TILE_SIZE / 2;
    g.position.z = -1 * (gridSize / 2) + (y * TILE_SIZE) + TILE_SIZE / 2;

    // These tile groups are static and need to be updated manually
    g.updateMatrix();
    this._group.add(g);
  }

  removeTile({ tile }) {
    this._group.remove(tile.getGroup());
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
            tile._ownLanes.push(...Object.values(topConnect));
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
            tile._ownLanes.push(...Object.values(leftConnect));
          }
        }

        for (const side of [ 1, 2 ]) {
          assert(side === 1 || side === 2);

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

    /** @type {Set<Lane>} */
    const lanes = new Set();

    /** @type {Map<Tile, [number, number]>} */
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
          from = rotate(Number(end[0]), 2);
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

  /**
   * @param {{ x: number, y: number }} tile
   */
  highlightTile(tile) {
    if (!tile) {
      this._highlightCube.visible = false;
      return;
    }

    this._highlightCube.visible = true;

    const [ aX, aY ] = this.getTileAnchorPosition(tile.x, tile.y);

    this._highlightCube.position.x = aX + TILE_SIZE / 2;
    this._highlightCube.position.z = aY + TILE_SIZE / 2;
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
}

export {
  GridMap
};
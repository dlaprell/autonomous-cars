// @ts-check

import standardWorld from './standard.json';

/** @typedef {import('../src/grid_tiles').TileBaseData} TileBaseData */
/** @typedef {Array<Array<TileBaseData>>} MapData */

/** @typedef {{ type: string, initial: [ number, number ] }} BaseMovementData */
/** @typedef {{ seed: number, type: 'random' } | BaseMovementData} RandomMovementData */
/** @typedef {{ path: Array<import('../src/utils').TileOrientation>, type: 'path' } | BaseMovementData} PathMovementData */

/** @typedef {import('type-fest').MergeExclusive<RandomMovementData, PathMovementData>} MovementData */



/**
 * @typedef {Object} CarData
 * @property {boolean} following
 * @property {number} startOffset
 * @property {{ noDriver?: boolean, noHead?: boolean, color?: string, initialSpeed?: number }} options
 * @property {MovementData} movement
 */

/**
 * @typedef {Object} WorldData
 * @property {MapData} map
 * @property {Array<CarData>} cars
 */

/** @type {Array<WorldData>} */
const worldsWithTargetAndNoDriver = [];

/** @type {Array<WorldData>} */
const worldsWithTarget = [];

/** @type {Array<WorldData>} */
const worldsWithNoDriver = [
  // @ts-expect-error
  standardWorld
];

/** @type {Array<WorldData>} */
const worldsBare = [];

/**
 * @param {WorldData} world
 * @returns {WorldData}
 */
function removeNoDriver(world) {
  return {
    map: world.map,
    cars: world.cars
      .map(car => {
        if (!car.options.noDriver && !car.options.noHead) {
          return car;
        }

        return {
          ...car,
          options: {
            ...car.options,
            noDriver: false,
            noHead: false
          }
        };
      })
  };
}

/**
 * @param {WorldData} world
 * @returns {WorldData}
 */
function removeTargets(world) {
  return {
    cars: world.cars,
    map: world.map
      .map(row => row.map(tile => {
        const opt = tile[2];
        if (!opt || (!opt.bench && !opt.trashCan && !opt.signs)) {
          return tile;
        }

        return [
          tile[0],
          tile[1],
          {
            ...opt,
            bench: opt.bench ? {} : null,
            trashCan: opt.trashCan ? {} : null,
            signs: !opt.signs ? [] : opt.signs.filter(s => s.type !== 'Target')
          }
        ];
      }))
  };
}

function getAllPossibleWorlds() {
  const worlds = {
    noDriver: [],
    target: [],
    noDriverAndTarget: [],
    bare: []
  };

  worlds.noDriver.push(...worldsWithNoDriver);
  worlds.target.push(...worldsWithTarget);
  worlds.noDriverAndTarget.push(...worldsWithTargetAndNoDriver);
  worlds.bare.push(...worldsBare);

  worlds.noDriver.push(...worldsWithTargetAndNoDriver.map(removeTargets));
  worlds.target.push(...worldsWithTargetAndNoDriver.map(removeNoDriver));

  worlds.bare.push(...worldsWithTarget.map(removeTargets));
  worlds.bare.push(...worldsWithNoDriver.map(removeNoDriver));
  worlds.bare.push(...worldsWithTargetAndNoDriver.map(removeNoDriver).map(removeTargets));

  return worlds;
}
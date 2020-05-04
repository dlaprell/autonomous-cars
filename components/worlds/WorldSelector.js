// @ts-check

import standardWorld from './standard.json';
import { shuffleArray, pickRandomEntries } from '../utils/array';

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
        if (!car.options.noDriver) {
          return car;
        }

        return {
          ...car,
          options: {
            ...car.options,
            noDriver: false
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

/** @typedef {"noDriver" | "target" | "targetAndNoDriver" | "bare"} RunConfig */

function getAllPossibleWorlds() {
  /** @type {Object.<RunConfig, Array<WorldData>>} */
  const worlds = {
    noDriver: [],
    target: [],
    targetAndNoDriver: [],
    bare: []
  };

  worlds.noDriver.push(...worldsWithNoDriver);
  worlds.target.push(...worldsWithTarget);
  worlds.targetAndNoDriver.push(...worldsWithTargetAndNoDriver);
  worlds.bare.push(...worldsBare);

  worlds.noDriver.push(...worldsWithTargetAndNoDriver.map(removeTargets));
  worlds.target.push(...worldsWithTargetAndNoDriver.map(removeNoDriver));

  worlds.bare.push(...worldsWithTarget.map(removeTargets));
  worlds.bare.push(...worldsWithNoDriver.map(removeNoDriver));
  worlds.bare.push(...worldsWithTargetAndNoDriver.map(removeNoDriver).map(removeTargets));

  return worlds;
}

/** @typedef {{ name: string, config: RunConfig, world: WorldData }} RunData */

// Small helper to extract `count` entries if possible and otherwise the most entries
// we can get
function pickAtMostRandomEntries(count, base) {
  return pickRandomEntries(Math.min(count, base.length), base);
}

export function extractWorldsForRuns() {
  // These should be selected at random
  /** @type {Object.<RunConfig, Array<WorldData>>} */
  const poss = getAllPossibleWorlds();

  /** @type {Array<RunData>} */
  const runs = [];

  // TODO: Add for variant 1, 2, 3, 4, 5, 6
  // runs.push(...pickAtMostRandomEntries(10, < array >))

  for (const [ c, entries ] of Object.entries(poss)) {
    /** @type {RunConfig} */
    const config = (/** @type {RunConfig} */ c);

    runs.push(...pickAtMostRandomEntries(10, entries).map(w => ({ config, name: '', world: w })));
  }

  // Finally, shuffle again to change the order of the
  return shuffleArray(runs);
}
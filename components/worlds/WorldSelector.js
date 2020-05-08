// @ts-check
import * as groupA1 from '../../situations/Group_A/standard_1.json';
import * as groupA2 from '../../situations/Group_A/standard_2.json';
import * as groupA3 from '../../situations/Group_A/standard_3.json';
import * as groupA4 from '../../situations/Group_A/standard_4.json';
import * as groupA5 from '../../situations/Group_A/standard_5.json';
import * as groupA6 from '../../situations/Group_A/standard_6.json';
import * as groupA7 from '../../situations/Group_A/standard_7.json';
import * as groupA8 from '../../situations/Group_A/standard_8.json';
import * as groupA9 from '../../situations/Group_A/standard_9.json';
import * as groupA10 from '../../situations/Group_A/standard_10.json';
import * as groupA11 from '../../situations/Group_A/standard_11.json';
import * as groupA12 from '../../situations/Group_A/standard_12.json';
import * as groupA13 from '../../situations/Group_A/standard_13.json';
import * as groupA14 from '../../situations/Group_A/standard_14.json';
import * as groupA15 from '../../situations/Group_A/standard_15.json';
import * as groupA16 from '../../situations/Group_A/standard_16.json';
import * as groupA17 from '../../situations/Group_A/standard_17.json';
import * as groupA18 from '../../situations/Group_A/standard_18.json';
import * as groupA19 from '../../situations/Group_A/standard_19.json';
import * as groupA20 from '../../situations/Group_A/standard_20.json';
import * as groupA21 from '../../situations/Group_A/standard_21.json';

import * as groupB1 from '../../situations/Group_B/standard_1.json';
import * as groupB2 from '../../situations/Group_B/standard_2.json';
import * as groupB3 from '../../situations/Group_B/standard_3.json';
import * as groupB4 from '../../situations/Group_B/standard_4.json';
import * as groupB5 from '../../situations/Group_B/standard_5.json';
import * as groupB6 from '../../situations/Group_B/standard_6.json';
import * as groupB7 from '../../situations/Group_B/standard_7.json';
import * as groupB8 from '../../situations/Group_B/standard_8.json';
import * as groupB9 from '../../situations/Group_B/standard_9.json';
import * as groupB10 from '../../situations/Group_B/standard_10.json';

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
 * @property {string} name
 * @property {MapData} map
 * @property {Array<CarData>} cars
 */

/** @type {Array<WorldData>} */
const worldsGroupA = [
  { name: 'groupA1', ...groupA1 },
  { name: 'groupA2', ...groupA2 },
  { name: 'groupA3', ...groupA3 },
  { name: 'groupA4', ...groupA4 },
  { name: 'groupA5', ...groupA5 },
  { name: 'groupA6', ...groupA6 },
  { name: 'groupA7', ...groupA7 },
  { name: 'groupA8', ...groupA8 },
  { name: 'groupA9', ...groupA9 },
  { name: 'groupA10', ...groupA10 },
  { name: 'groupA11', ...groupA11 },
  { name: 'groupA12', ...groupA12 },
  { name: 'groupA13', ...groupA13 },
  { name: 'groupA14', ...groupA14 },
  { name: 'groupA15', ...groupA15 },
  { name: 'groupA16', ...groupA16 },
  { name: 'groupA17', ...groupA17 },
  { name: 'groupA18', ...groupA18 },
  { name: 'groupA19', ...groupA19 },
  { name: 'groupA20', ...groupA20 },
  { name: 'groupA21', ...groupA21 }
];

/** @type {Array<WorldData>} */
const worldsGroupB = [
 { name: 'groupB1', ...groupB1 },
 // TODO: this one has no cars
 // { name: 'groupB2', ...groupB2 },
 { name: 'groupB3', ...groupB3 },
 { name: 'groupB4', ...groupB4 },
 { name: 'groupB5', ...groupB5 },
 { name: 'groupB6', ...groupB6 },
 { name: 'groupB7', ...groupB7 },
 { name: 'groupB8', ...groupB8 },
 { name: 'groupB9', ...groupB9 },
 { name: 'groupB10', ...groupB10 }
];

/** @type {Array<WorldData>} */
const worldsBare = [];

/**
 * @param {WorldData} world
 * @returns {WorldData}
 */
function removeNoDriver(world) {
  return {
    name: world.name,
    map: world.map,
    cars: world.cars
      .map(car => {
        if (!car || !car.options || !car.options.noDriver) {
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
    name: world.name,
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
  const worlds = {
    /** @type {Object.<RunConfig, Array<WorldData>>} */
    groupA: {
      noDriver: [],
      target: [],
      targetAndNoDriver: [ ...worldsGroupA ],
      bare: []
    },

    groupB: {
      /** @type {Array<WorldData>} */
      target: [],
      /** @type {Array<WorldData>} */
      targetAndNoDriver: [ ...worldsGroupB ]
    }
  };

  worlds.groupA.noDriver.push(
    ...worldsGroupA.map(removeTargets)
  );
  worlds.groupA.target.push(
    ...worldsGroupA.map(removeNoDriver)
  );
  worlds.groupA.bare.push(
    ...worldsGroupA.map(removeNoDriver).map(removeTargets)
  );

  worlds.groupB.target.push(
    ...worldsGroupB.map(removeNoDriver)
  );

  return worlds;
}

/** @typedef {{ name: string, world: WorldData }} RunData */

// Small helper to extract `count` entries if possible and otherwise the most entries
// we can get
function pickAtMostRandomEntries(count, base) {
  return pickRandomEntries(Math.min(count, base.length), base);
}

export function extractWorldsForRuns() {
  // These should be selected at random
  const poss = getAllPossibleWorlds();

  /** @type {Array<RunData>} */
  const runs = [];

  for (const [ gid, entries ] of Object.entries(poss)) {
    for (const [ config, worlds ] of Object.entries(entries)) {
      const baseName = `${gid}_${config}`;

      runs.push(
        ...pickAtMostRandomEntries(10, worlds)
          .map(w => ({
            name: `${baseName}_${w.name}`,
            world: w
          }))
      );
    }
  }

  // Finally, shuffle again to change the order of the
  return shuffleArray(runs);
}
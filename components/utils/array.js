// @ts-check

import { assert } from "./assert";

/**
 * @template T
 * @param {Array<T>} array
 * @returns {Array<T>}
 */
export function shuffleArray(array) {
  return array.sort(() => 0.5 - Math.random());
}

/**
 * @template T
 * @param {number} count
 * @param {Array<T>} base
 * @returns {Array<T>}
 */
export function pickRandomEntries(count, base) {
  assert(base.length >= count);

  if (base.length === count) {
    return base;
  }

  const shuffled = shuffleArray(base);
  return shuffled.slice(0, count);
}
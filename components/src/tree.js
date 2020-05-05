// @ts-check

import { RandomGen } from './randomgen';
import { addColorToGeometry } from './utils';

import { assert } from '../utils/assert';
import { mergeBufferGeometries } from '../utils/merge_buffers';

/** @typedef {import('three').BufferGeometry} BufferGeometry */

const treeDis = [
  { type: 'Spreading', mean: 9 },
  { type: 'Pyramidal', mean: 4 },
  { type: 'Open', mean: 1 },
  { type: 'Round', mean: 6 },
  { type: 'Branched', mean: 3 },
];

/** @type {Map<number, BufferGeometry>} */
const forestGeometryCache = new Map();

/**
 * @param {number} value
 * @param {Object.<string, Object>} models
 * @returns {THREE.BufferGeometry}
 */
function getForestGeometriesCached(value, models) {
  value = value % 6;

  if (forestGeometryCache.has(value)) {
    return forestGeometryCache.get(value).clone();
  }

  const rnd = new RandomGen(value);

  const treeGeometries = [];

  for (const { type, mean } of treeDis) {
    const count = Math.round(rnd.normalDistribution(mean).value());
    if (count <= 0) {
      continue;
    }

    for (let i = 0; i < count; i++) {
      const t = models[`tree${type}`];

      const xOffset = rnd.integer(-7, 7);
      const yOffset = rnd.integer(-7, 7);

      /** @type {THREE.Mesh?} */
      let trunk = null;

      /** @type {THREE.Mesh?} */
      let leaves = null;

      t.traverse(child => {
        if (!child.isMesh) {
          return;
        }

        if (child.name === 'trunk') {
          trunk = child;
        }

        if (child.name === 'leaves') {
          leaves = child;
        }
      });

      assert(trunk && leaves);

      /** @type {THREE.BufferGeometry} */
      const trunkGeometry = (/** @type {THREE.BufferGeometry} */ trunk.geometry.clone());

      /** @type {THREE.BufferGeometry} */
      const leavesGeometry = (/** @type {THREE.BufferGeometry} */ leaves.geometry.clone());

      // Some models have the color attribute set, but this prevents the
      // geometries from being mergeable
      trunkGeometry.deleteAttribute('color');
      leavesGeometry.deleteAttribute('color');

      t.position.x = xOffset;
      t.position.y = yOffset;
      t.rotation.x = -Math.PI / 2;

      t.updateWorldMatrix(true, false);
      trunkGeometry.applyMatrix4(t.matrixWorld);
      leavesGeometry.applyMatrix4(t.matrixWorld);

      addColorToGeometry(leavesGeometry, '#7bd497');
      addColorToGeometry(trunkGeometry, '#755022');

      treeGeometries.push(leavesGeometry, trunkGeometry);
    }
  }

  assert(treeGeometries.length > 0);
  const singleGeometry = mergeBufferGeometries(treeGeometries);
  assert(singleGeometry);

  forestGeometryCache.set(value, singleGeometry);
  return singleGeometry.clone();
}

export {
  getForestGeometriesCached
};
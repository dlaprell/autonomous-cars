// @ts-check
import { BufferAttribute, Color } from 'three';
import { assert } from '../utils/assert';

/**
 * @param {number} v 
 * @returns {0 | 1 | 2 | -1}
 */
function normalizeRotation(v) {
   const limited = v % 4;
   const res = ((limited + 5) % 4) - 1;
   assert(res === 0 || res === 1 || res === 2 || res === -1);
   return res;
} 

/**
 * @param {number} base
 * @param {number} by
 * @returns {0 | 1 | 2 | -1}
 */
function rotate(base, by) {
  return normalizeRotation(
    (((base + 1) + by) % 4) - 1
  );
}

/**
 * @param {number} base
 * @param {number} to
 * @returns {0 | 1 | 2 | -1}
 */
function angle(base, to) {
  return rotate(to, -base);
}

function addColorToGeometry(geometry, c) {
  const color = new Color(c);

  // make an array to store colors for each vertex
  const numVerts = geometry.getAttribute('position').count;
  const itemSize = 3;  // r, g, b
  const colors = new Uint8Array(itemSize * numVerts);

  // get the colors as an array of values from 0 to 255
  const rgb = color.toArray().map(v => v * 255);

  // copy the color into the colors array for each vertex
  colors.forEach((_, idx) => {
    colors[idx] = rgb[idx % 3];
  });

  const normalized = true;
  const colorAttrib = new BufferAttribute(colors, itemSize, normalized);
  geometry.setAttribute('color', colorAttrib);
}

export {
  normalizeRotation,
  rotate,
  angle,

  addColorToGeometry
};
import { BufferAttribute, Color } from 'three';

function normalizeRotation(v) {
   const limited = v % 4;
   return ((limited + 5) % 4) - 1;
} 

function rotate(base, by) {
  return normalizeRotation(
    (((base + 1) + by) % 4) - 1
  );
}

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
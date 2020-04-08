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

export {
  normalizeRotation,
  rotate,
  angle
};
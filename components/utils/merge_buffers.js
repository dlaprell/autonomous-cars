// @ts-check

/**
 * @author mrdoob / http://mrdoob.com/
 */

import { BufferAttribute, BufferGeometry } from "three";

/**
 * @param {Array<BufferAttribute>} attributes
 * @return {BufferAttribute?}
 */
function mergeBufferAttributes(attributes) {
  if (attributes.length === 0) {
    return null;
  }

  const first = attributes[0];

  // @ts-expect-error
  if (first.isInterleavedBufferAttribute) {
    return null;
  }

  const TypedArray = first.array.constructor;

  const itemSize = first.itemSize;
  const normalized = first.normalized;

  let arrayLength = first.array.length;

  for (let i = 1; i < attributes.length; ++i) {
    const attribute = attributes[i];

    // @ts-expect-error
    if (attribute.isInterleavedBufferAttribute) {
      return null;
    }

    if (TypedArray !== attribute.array.constructor) {
      return null;
    }

    if (itemSize !== attribute.itemSize) {
      return null;
    }

    if (normalized !== attribute.normalized) {
      return null;
    }

    arrayLength += attribute.array.length;
  }

  // @ts-expect-error
  const array = new TypedArray(arrayLength);
  let offset = 0;

  for (let i = 0; i < attributes.length; ++i) {
    array.set(attributes[i].array, offset);
    offset += attributes[i].array.length;
  }

  return new BufferAttribute(array, itemSize, normalized);
}

/**
 * @param  {Array<BufferGeometry>} geometries
 * @return {BufferGeometry?}
 */
function mergeBufferGeometries(geometries) {
  if (geometries.length === 0) {
    return null;
  }

  const isIndexed = geometries[0].index !== null;

  const attributesUsed = new Set(Object.keys(geometries[0].attributes));
  const morphAttributesUsed = new Set(
    Object.keys(geometries[0].morphAttributes)
  );

  const attributes = {};
  const morphAttributes = {};

  const morphTargetsRelative = geometries[0].morphTargetsRelative;

  const mergedGeometry = new BufferGeometry();

  for (let i = 0; i < geometries.length; ++i) {
    const geometry = geometries[i];

    // ensure that all geometries are indexed, or none

    if (isIndexed !== (geometry.index !== null)) return null;

    // gather attributes, exit early if they're different

    for (const name in geometry.attributes) {
      if (!attributesUsed.has(name)) return null;

      if (typeof attributes[name] === 'undefined') attributes[name] = [];

      attributes[name].push(geometry.attributes[name]);
    }

    // gather morph attributes, exit early if they're different

    if (morphTargetsRelative !== geometry.morphTargetsRelative) return null;

    for (const name in geometry.morphAttributes) {
      if (!morphAttributesUsed.has(name)) return null;

      if (typeof morphAttributes[name] === 'undefined') morphAttributes[name] = [];

      morphAttributes[name].push(geometry.morphAttributes[name]);
    }

    // gather .userData

    mergedGeometry.userData.mergedUserData =
      mergedGeometry.userData.mergedUserData || [];
    mergedGeometry.userData.mergedUserData.push(geometry.userData);
  }

  // merge indices

  if (isIndexed) {
    let indexOffset = 0;
    let mergedIndex = [];

    for (let i = 0; i < geometries.length; ++i) {
      const index = geometries[i].index;

      for (let j = 0; j < index.count; ++j) {
        mergedIndex.push(index.getX(j) + indexOffset);
      }

      indexOffset += geometries[i].attributes.position.count;
    }

    mergedGeometry.setIndex(mergedIndex);
  }

  // merge attributes

  for (const name in attributes) {
    const mergedAttribute = mergeBufferAttributes(attributes[name]);

    if (!mergedAttribute) return null;

    mergedGeometry.setAttribute(name, mergedAttribute);
  }

  // merge morph attributes

  for (const name in morphAttributes) {
    const numMorphTargets = morphAttributes[name][0].length;

    if (numMorphTargets === 0) break;

    mergedGeometry.morphAttributes = mergedGeometry.morphAttributes || {};
    mergedGeometry.morphAttributes[name] = [];

    for (let i = 0; i < numMorphTargets; ++i) {
      const morphAttributesToMerge = [];

      for (let j = 0; j < morphAttributes[name].length; ++j) {
        morphAttributesToMerge.push(morphAttributes[name][j][i]);
      }

      const mergedMorphAttribute = mergeBufferAttributes(
        morphAttributesToMerge
      );

      if (!mergedMorphAttribute) return null;

      mergedGeometry.morphAttributes[name].push(mergedMorphAttribute);
    }
  }

  return mergedGeometry;
}

export {
  mergeBufferAttributes,
  mergeBufferGeometries
};
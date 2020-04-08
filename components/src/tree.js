import { MeshLambertMaterial } from 'three';

const leaveMaterial = new MeshLambertMaterial({
  color: '#7bd497'
});

const trunkMaterial = new MeshLambertMaterial({
  color: '#755022'
});

function adaptTreeObject(tree) {
  const t = tree.clone();

  t.traverse((child) => {
    if (child.isMesh) {
      if (child.name === 'trunk') {
        child.material = trunkMaterial;
      }
    
      if (child.name === 'leaves') {
        child.material = leaveMaterial;
      }
    }
  });

  t.scale.multiplyScalar(0.6);
  t.rotation.x = -Math.PI / 2;
  
  t.castShadow = true;
  return t;
}

export {
  adaptTreeObject
};
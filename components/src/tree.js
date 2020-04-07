import { Group, MeshLambertMaterial } from 'three';
import { GLTFLoader } from '../third-party/GLTFLoader';

const leaveMaterial = new MeshLambertMaterial({
  color: '#7bd497'
});

const trunkMaterial = new MeshLambertMaterial({
  color: '#755022'
});

class Tree {
  constructor(type) {
    this._group = new Group();

    this._parts = {};

    this._type = type;
  }

  group() {
    return this._group;
  }

  render() {
    new GLTFLoader()
      .load(`/objects/tree-${this._type}.gltf`, (gltf) => {
        gltf.scene.traverse((child) => {
          if (child.isMesh) { 
              child.material.alphaTest = 0.2;

              this._parts[child.name] = child;
           }
        });

        const object = gltf.scene;
        object.scale.multiplyScalar(0.3);
        object.rotation.x = -Math.PI / 2;

        if (this._parts.trunk) {
          this._parts.trunk.material = trunkMaterial;
        }

        if (this._parts.leaves) {
          this._parts.leaves.material = leaveMaterial;
        }
        
        object.castShadow = true;
        this._group.add(object);
    
      }, null, err => console.error(err));
  }
}

Tree.TYPES = {
  BRANCHED: 'branched',
  SPREADING: 'spreading',
  ROUND: 'round',
  PYRAMIDAL: 'pyramidal',
  OPEN: 'open'
};
Tree.TYPE_LIST = [ 'branched', 'spreading', 'round', 'pyramidal', 'open' ];

export {
  Tree
};
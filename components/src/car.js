import * as THREE from 'three';
import mitt from 'mitt';

import { GLTFLoader } from '../third-party/GLTFLoader';

class Car {
  constructor(movement) {
    this._movement = movement;

    this._group = new THREE.Group();

    this._emitter = mitt();
  }

  onUpdate(listener) {
    this._emitter.on('update', listener);
  }

  setSpeed(s) {
    this._movement.setSpeed(s);
  }

  setAcceleration(a) {
    this._movement.setAcceleration(a);
  }

  checkIfSpeedChangeNeeded() {
    const cur = this._movement.speed();

    const { from, to } = this._movement.getCurrentTileMovement();
    const nextDir = this._movement.getNextTileDirections();

    const curTile = this._movement.currentTile().tile;
    const next = this._movement.targetTile().tile;

    let limiter = 1;
    if (((from + to) % 2) !== 0) {
      limiter = 2.0;
    } else if (((nextDir.from + nextDir.to) % 2) !== 0) {
      limiter = 1.5;
    }

    const curLimit = curTile.speedLimitation() / limiter;
    const nextLimit = next.speedLimitation() / limiter;

    let acc = 0;

    if (cur > curLimit) {
      acc = -0.000004;
    } else if (cur > nextLimit) {
      acc = -0.0000004;
    } else if (cur < curLimit) {
      acc =  0.0000008;
    }

    this._movement.setAcceleration(acc);
  }

  update(timeDeltaMs) {
    this.checkIfSpeedChangeNeeded();

    this._movement.update(timeDeltaMs);

    const x = this._movement.getX();
    const y = this._movement.getY();
    const angle = this._movement.getAngle();

    this._group.position.x = x;
    this._group.position.z = y;
    this._group.rotation.y = -angle;

    this._emitter.emit('update', {
      target: this,
      
      timeDeltaMs: timeDeltaMs,

      x,
      y,
      angle
    });

    return { x, y, angle };
  }

  getGroup() {
    return this._group;
  }

  render() {
    const manager = new THREE.LoadingManager();

    new GLTFLoader(manager)
      .load('/objects/Car_Tuerkis_v3.gltf', (gltf) => {
        gltf.scene.traverse(function (child) {
          if (child.isMesh) { 
              child.material.alphaTest = 0.2;
           }
        });

        const object = gltf.scene;

        object.rotation.x -= (Math.PI / 2);
        object.rotation.z += Math.PI / 2;
        object.rotation.z += Math.PI;
        object.position.y -= 0.42;

        this._group.add(object);
    
        gltf.animations; // Array<THREE.AnimationClip>
        gltf.scene; // THREE.Group
        gltf.scenes; // Array<THREE.Group>
        gltf.cameras; // Array<THREE.Camera>
        gltf.asset; // Object
    
      }, null, err => console.error(err));
  }
}

export { Car };
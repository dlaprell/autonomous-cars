import * as THREE from 'three';
import mitt from 'mitt';

import { GridMovement } from './movement';

class Car {
  constructor(grid, path) {
    this._movement = new GridMovement(grid, path);

    this._group = new THREE.Group();

    this._emitter = mitt();
  }

  onUpdate(listener) {
    this._emitter.on('update', listener);
  }

  setSpeed(s) {
    this._movement.setSpeed(s);
  }

  update(timeDeltaMs) {
    this._movement.update(timeDeltaMs);

    const x = this._movement.getX();
    const y = this._movement.getY();
    const angle = this._movement.getAngle();

    this._group.position.x = x;
    this._group.position.z = y;
    this._group.rotation.y = angle;

    this._emitter.emit('update', {
      target: this,
      
      timeDeltaMs: timeDeltaMs,

      x,
      y,
      angle
    });
  }

  getGroup() {
    return this._group;
  }

  render() {
    // TODO: replace with an actual car model
    const geometry = new THREE.BoxGeometry(1.5, 1, 3);
    const material = new THREE.MeshBasicMaterial({ color: 0x0000FF, side: THREE.FrontSide });
    const cube = new THREE.Mesh(geometry, material);

    cube.position.y += 0.5;
    this._group.add(cube);
  }
}

export { Car };
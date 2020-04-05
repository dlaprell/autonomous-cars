import * as THREE from 'three';
import mitt from 'mitt';
import { OBJLoader } from '../third-party/OBJLoader';

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
      acc = -0.0000012;
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
    // // TODO: replace with an actual car model
    // const geometry = new THREE.BoxGeometry(1.5, 1, 3);
    // const material = new THREE.MeshBasicMaterial({ color: 0x0000FF, side: THREE.FrontSide });
    // const cube = new THREE.Mesh(geometry, material);

    // cube.position.y += 0.5;

    // const circle = new THREE.Mesh(
    //   new THREE.CircleGeometry(0.25),
    //   new THREE.MeshBasicMaterial({ color: 0xFF0000, side: THREE.DoubleSide })
    // );

    // circle.position.y += 1.0001;
    // circle.position.z -= 1;
    // circle.rotation.x = -Math.PI / 2;

    // this._group.add(circle);
    // this._group.add(cube);

    var loader = new OBJLoader();

    // load a resource
    loader.load(
      // resource URL
      '/objects/Low_Poly_City_Cars.obj',
      // called when resource is loaded
      (object) => {
        this._group.add( object );
      },
      // called when loading is in progresses
      function ( xhr ) {

        console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

      },
      // called when loading has errors
      function ( error ) {
        console.log( 'An error happened', error);
      }
    );
  }
}

export { Car };
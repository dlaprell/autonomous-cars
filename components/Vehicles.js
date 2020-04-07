import { SimluationSceneElement } from './SimulationScene';

import { Car } from './src/car';
import { RandomMovement } from './src/movement';
import { Vector3 } from 'three';

class MovingCar extends SimluationSceneElement {
  constructor(...args) {
    super(...args);

    const { grid, initial, random } = this.props;

    this._car = new Car(
      new RandomMovement(grid, initial, random)
    );

    this._car.render();
    this.group().add(this._car.getGroup());
  }

  update(_, delta, rest) {
    const { x, y, angle } = this._car.update(delta);

    const { following } = this.props;
    if (!following) {
      return;
    }

    const camera = rest.camera;

    camera.position.y = 0.95;
    camera.position.x = x;
    camera.position.z = y;

    const offsetX = -0.225;
    const offsetY = 1.6;

    camera.position.x += offsetX * Math.cos(angle) - offsetY * Math.sin(angle);
    camera.position.z += offsetY * Math.cos(angle) + offsetX * Math.sin(angle);

    camera.rotation.y = -angle;
    camera.rotation.x = 0;
    camera.rotation.z = 0;
    camera.rotateOnAxis({ x: 1, y: 0, z: 0 }, -1 * Math.PI * 0.01);
  }

  render() {
    const { acceleration } = this.props;

    if (!Number.isNaN(Number(acceleration))) {
      this._car.setAcceleration(acceleration);
    }

    return super.render();
  }
}

export {
  MovingCar
};
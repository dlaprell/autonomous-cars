import { SimluationSceneElement } from './SimulationScene';

import { Car } from './src/car';
import { RandomMovement } from './src/movement';

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

    camera.position.y = 1;
    camera.position.x = x;
    camera.position.z = y;

    camera.rotation.y = -angle;
    camera.rotation.x = 0;
    camera.rotation.z = 0;
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
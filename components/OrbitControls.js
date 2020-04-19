import { OrbitControls as ThreeOrbitControls } from './third-party/OrbitControls';

import { SimluationSceneElement } from './SimulationScene';

class OrbitControls extends SimluationSceneElement {
  constructor(...args) {
    super(...args);

    this._controls = null;
    this._element = null;
  }

  update(t, d, { camera }) {
    const { enabled, container } = this.props;

    if (this._controls === null || this._element !== container) {
      if (this._controls) {
        this._controls.dispose();
      }

      this._controls = new ThreeOrbitControls(camera, container);
      this._element = container;

      this._controls.minDistance = 1;
      this._controls.maxDistance = 1500; // 25;
    }

    this._controls.enabled = enabled;
  }
}

export {
  OrbitControls
};
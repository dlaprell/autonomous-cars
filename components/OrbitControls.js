import { OrbitControls as ThreeOrbitControls } from 'three-controls';

import { SimluationSceneElement } from './SimulationScene';

class OrbitControls extends SimluationSceneElement {
  constructor(...args) {
    super(...args);

    this._controls = null;
  }

  update(t, d, { camera }) {
    if (this._controls === null) {
      this._controls = new ThreeOrbitControls(camera);
      
      this._controls.minDistance = 1;
      this._controls.maxDistance = 500; // 25;
    }

    const { enabled } = this.props;
    this._controls.enabled = enabled;
  }
}

export {
  OrbitControls
};
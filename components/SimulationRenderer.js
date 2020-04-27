/** @jsx h */

import { WebGLRenderer, PerspectiveCamera, Group } from 'three';
import { h, Component } from 'preact';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

class SimulationRenderer extends Component {
  constructor(...args) {
    super(...args);

    const { vr } = this.props;
    // Cannot be changed later on
    this._vr = vr;

    this._totalTime = 0;
    this._lastTime = null;

    this._ref = null;
    this._mounted = false;
    this._paused = false;

    this._initialRender = true;

    this._renderer = new WebGLRenderer({ antialias: false /* , alpha: true */ });
    // this._renderer.shadowMap.enabled = true;
    this._renderer.xr.enabled = vr;

    this._resizeHandler = () => {
      const width = this._ref.clientWidth;
      const height = this._ref.clientHeight;

      this._renderer.setSize(width, height);

      this._camera.aspect = width / height; // aspect ratio
      this._camera.updateProjectionMatrix();
    };

    this._updateCameraPosition = (x, y, z) => {
      const pos = (this._vr ? this._cameraWrapper : this._camera).position;

      if (x !== null) {
        pos.x = x;
      }
      if (y !== null) {
        pos.y = y;
      }
      if (x !== null) {
        pos.z = z;
      }
    };

    this._updateCameraRotation = (x, y, z) => {
      const rot = (this._vr ? this._cameraWrapper : this._camera).rotation;

      if (x !== null) {
        rot.x = x;
      }
      if (y !== null) {
        rot.y = y;
      }
      if (x !== null) {
        rot.z = z;
      }
    };

    this._updateRef = (update) => {
      if (!update && this._mounted) {
        this.removeRenderer();
        this._ref = update;
      }

      if (update && (!this._mounted || this._ref !== update)) {
        if (this._ref !== update && this._mounted) {
          this.removeRenderer();
        }

        this._ref = update;
        this.addRenderer();
      }
    }

    this._runUpdate = () => {
      if (!this._mounted || this._paused) {
        return;
      }

      const { loop } = this.props;

      if (!this._vr) {
        window.requestAnimationFrame(this._runUpdate);
      }

      const initial = this._initialRender;
      if (this._initialRender) {
        this._initialRender = false;
      }

      const { onTimeUpdate, onVisualizationUpdate } = this.props;

      let delta = 0;

      if (!initial) {
        // We only update the time, after the initial render
        // since the first rendering may take much longer

        if (this._lastTime === null) {
          this._lastTime = new Date();
        }

        if (loop) {
          const now = new Date();

          delta = Math.min(100, now - this._lastTime);
          this._totalTime += delta;

          this._lastTime = now;
        }
      }

      if (onTimeUpdate) {
        onTimeUpdate(this._totalTime, delta);
      }

      if (onVisualizationUpdate) {
        onVisualizationUpdate({
          renderer: this._renderer,
          camera: this._camera,
          cameraWrapper: this._cameraWrapper,
          updateCameraPosition: this._updateCameraPosition,
          updateCameraRotation: this._updateCameraRotation
        });
      }
    };
  }

  addRenderer() {
    this._ref.appendChild(this._renderer.domElement);
    this._mounted = true;

    if (this._vr) {
      this._ref.appendChild(VRButton.createButton(this._renderer));
      this._renderer.setAnimationLoop(this._runUpdate);
    } else {
      window.requestAnimationFrame(this._runUpdate);
    }
  }

  removeRenderer() {
    this._renderer.domElement.remove();
    this._mounted = false;
  }

  componentDidMount() {
    const width = this._ref.clientWidth;
    const height = this._ref.clientHeight;

    const { creatorView } = this.props;

    this._camera = new PerspectiveCamera(20, width / height, .1, creatorView ? 2500 : 750);

    if (this._vr) {
      this._cameraWrapper = new Group();
      this._cameraWrapper.add(this._camera);
    }

    this._camera.rotation.x = 0;
    this._camera.rotation.y = 0;
    this._updateCameraPosition(0, 200, 3);

    this._renderer.setSize(width, height);

    window.addEventListener('resize', this._resizeHandler);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this._resizeHandler);
  }

  render() {
    return (
      <div
        ref={this._updateRef}
        style={{
          width: '100%',
          height: '100%',

          margin: 0,
          padding: 0
        }}
      />
    );
  }
}

export {
  SimulationRenderer
}
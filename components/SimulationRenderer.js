/** @jsx h */
// @ts-check

import { WebGLRenderer, PerspectiveCamera, Group, PCFSoftShadowMap } from 'three';
import { h, Component } from 'preact';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

import { assert } from './utils/assert';
import { WebXrProvider, RafTimeProvider, TimeProvider } from './TimeProvider';

class SimulationRenderer extends Component {
  constructor(...args) {
    super(...args);

    const { vr, timeProvider, scene, renderOptions } = this.props;
    // Cannot be changed later on
    this._vr = vr;

    this._ref = null;
    this._mounted = false;

    assert(scene);
    /** @type {THREE.Scene} */
    this._scene = scene;

    this._renderer = new WebGLRenderer({
      antialias: Boolean(renderOptions.antialias)
    });

    if (renderOptions.shadow) {
      this._renderer.shadowMap.enabled = true;
      this._renderer.shadowMap.type = PCFSoftShadowMap;
      this._renderer.shadowMapDebug = process.env.NODE_ENV !== 'production';
    }

    this._renderer.xr.enabled = vr;
    this._renderer.toneMappingExposure = 1.5;

    const { creatorView } = this.props;
    this._camera = new PerspectiveCamera(20, 1, .1, creatorView ? 2500 : 750 );
    this._scene._camera = this._camera;

    /** @type {THREE.Group?} */
    this._cameraWrapper = null;

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

    this._context = {
      renderer: this._renderer,
      camera: this._camera,

      /** @type {HTMLCanvasElement?} */
      canvas: null,

      updateCameraPosition: this._updateCameraPosition,
      updateCameraRotation: this._updateCameraRotation
    };

    this._runUpdate = ({ total, delta }) => {
      if (!this._mounted) {
        console.warn("Not mounted - not rendering anything");
        return;
      }

      const { onTimeUpdate, onVisualizationUpdate } = this.props;

      if (onTimeUpdate) {
        onTimeUpdate(total, delta);
      }

      if (onVisualizationUpdate) {
        onVisualizationUpdate(this._context);
      }

      this._renderer.render(this.props.scene, this._camera);
    };

    /** @type {TimeProvider} */
    this._provider = timeProvider;
    if (!this._provider) {
      if (vr) {
        this._provider = new WebXrProvider(this._context);
      } else {
        this._provider = new RafTimeProvider(this._context);
      }
    } else {
      this._provider.setContext(this._context);
    }

    this._provider.registerOnFrame(this._runUpdate);
  }

  startProvider() {
    // this._runUpdate({ total: 0, delta: 0 });
    this._renderer.render(this.props.scene, this._camera);
    this._provider.start();
  }

  addRenderer() {
    this._ref.appendChild(this._renderer.domElement);
    this._mounted = true;

    this._context.canvas = this._renderer.domElement;

    if (this._vr) {
      this._ref.appendChild(VRButton.createButton(this._renderer));

      /** @type {WebXrProvider} */
      const prov = (/** @type {WebXrProvider} */ this._provider);
      this._renderer.setAnimationLoop(prov.getXrCallback());
    }

    if (this.props.loop) {
      this.startProvider();
    }
  }

  removeRenderer() {
    this._renderer.domElement.remove();
    this._mounted = false;

    this._provider.stop();
  }

  componentDidMount() {
    const width = this._ref.clientWidth;
    const height = this._ref.clientHeight;

    this._camera.aspect = width / height; // aspect ratio

    if (this._vr) {
      const cameraWrapper = new Group();
      cameraWrapper.add(this._camera);

      this._cameraWrapper = cameraWrapper;
      this._scene.add(cameraWrapper);
    }

    this._camera.rotation.x = 0;
    this._camera.rotation.y = 0;
    this._updateCameraPosition(0, 200, 3);

    this._camera.updateProjectionMatrix();

    this._renderer.setSize(width, height);

    window.addEventListener('resize', this._resizeHandler);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this._resizeHandler);
    this._provider.stop();
  }

  componentDidUpdate() {
    const { loop } = this.props;

    if (this._provider.looping() !== loop && this._mounted) {
      if (!loop) {
        this._provider.stop();
      } else if (this._mounted) {
        this.startProvider();
      }
    }
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
/** @jsx h */

import { WebGLRenderer, PerspectiveCamera } from 'three';
import { h, Component } from 'preact';

class SimulationRenderer extends Component {
  constructor(...args) {
    super(...args);

    this._totalTime = 0;
    this._lastTime = null;
  
    this._ref = null;
    this._mounted = false;
    this._paused = false;

    this._renderer = new WebGLRenderer({ antialias: false /* , alpha: true */ });
    // this._renderer.shadowMap.enabled = true;

    this._resizeHandler = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      this._renderer.setSize( width, height );
      this._camera.aspect = width / height; // aspect ratio
      this._camera.updateProjectionMatrix();
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

      window.requestAnimationFrame(this._runUpdate);

      if (this._lastTime === null) {
        this._lastTime = new Date();
      }

      let delta = 0;

      if (loop) {
        const now = new Date();

        delta = Math.min(100, Math.max(1, now - this._lastTime));
        this._totalTime += delta;

        this._lastTime = now;
      }

      const { onUpdate } = this.props;
      if (onUpdate) {
        try {
          onUpdate(this._totalTime, delta, {
            renderer: this._renderer,
            camera: this._camera
          });
        } catch (ex) {
          this._paused = true;
          throw ex;
        }
      }
    };
  }

  addRenderer() {
    this._ref.appendChild(this._renderer.domElement);
    this._mounted = true;

    window.requestAnimationFrame(this._runUpdate);
  }

  removeRenderer() {
    this._renderer.domElement.remove();
    this._mounted = false;
  }

  componentDidMount() {
    this._camera = new PerspectiveCamera(12, window.innerWidth / window.innerHeight, 1, 2000);
    this._camera.position.set(0, 200, 3);

    this._renderer.setSize(window.innerWidth, window.innerHeight);

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
          width: '100vw',
          height: '100vh',

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
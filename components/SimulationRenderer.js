/** @jsx h */

import { WebGLRenderer, PerspectiveCamera } from 'three';
import { h, Component } from 'preact';

class SimulationRenderer extends Component {
  constructor(...args) {
    super(...args);

    this._startTime = null;
    this._lastTime = null;
  
    this._ref = null;
    this._mounted = false;

    this._renderer = new WebGLRenderer({ antialias: false });

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
      if (!this._mounted) {
        return;
      }

      window.requestAnimationFrame(this._runUpdate);

      if (this._startTime === null) {
        this._startTime = new Date();
      }

      const sinceStart = Math.max(1, new Date() - this._startTime);
      const delta = sinceStart - this._lastTime;
      this._lastTime = sinceStart;

      const { onUpdate } = this.props;
      if (onUpdate) {
        onUpdate(sinceStart, delta, {
          renderer: this._renderer,
          camera: this._camera
        });
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
    this._camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 2500);
    this._camera.position.set(0, 100, 3);

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
/** @jsx h */

import { Scene, Group, AmbientLight, PointLight } from 'three';
import { h, Component, createContext } from 'preact';

import { SimulationRenderer } from './SimulationRenderer';

const SceneContext = createContext(null);

class SimulationScene extends Component {
  constructor(...args) {
    super(...args);

    this._scene = new Scene();

    var ambientLight = new AmbientLight(0xA0A0A0, 0.5); // soft white light
    this._scene.add(ambientLight);

    var spotLight = new PointLight( 0xffffff, 0.6);
    spotLight.position.set(-150, 500, 200);
    spotLight.castShadow = true;

    this._scene.add(spotLight);

    this._updateableTimeElements = new Set();
    this._updateableVisualizationElements = new Set();

    const {
      background
    } = this.props;

    if (background) {
      this._scene.background = background;
    }

    this.handleTimeUpdate = (time, delta) => {
      const { onTimeUpdate } = this.props;
      if (onTimeUpdate) {
        onTimeUpdate(time, delta);
      }

      for (const e of this._updateableTimeElements.values()) {
        e.updateTime(time, delta);
      }
    };

    this.handleVisualizationUpdate = (rest) => {
      for (const e of this._updateableVisualizationElements.values()) {
        e.updateVisualization(rest);
      }
    };
  }

  addElement(e) {
    this._scene.add(e.group());

    if (typeof e.updateVisualization === 'function') {
      this._updateableVisualizationElements.add(e);
    }

    if (typeof e.updateTime === 'function') {
      this._updateableTimeElements.add(e);
    }
  }

  removeElement(e) {
    this._scene.remove(e.group());

    this._updateableVisualizationElements.delete(e);
    this._updateableTimeElements.delete(e);
  }

  render() {
    const { children, loop, creatorView, vr, timeProvider } = this.props;

    return (
      <SceneContext.Provider value={this}>
        {children}

        <SimulationRenderer
          creatorView={creatorView}
          loop={Boolean(loop)}
          vr={vr}
          scene={this._scene}
          timeProvider={timeProvider}

          onTimeUpdate={this.handleTimeUpdate}
          onVisualizationUpdate={this.handleVisualizationUpdate}

          onUpdate={this.handleUpdate}
        />
      </SceneContext.Provider>
    );
  }
}

class SimluationSceneElement extends Component {
  constructor(...args) {
    super(...args);

    this._group = new Group();

    this._assignedScene = null;

    this._updateAssignment = (scene) => {
      if (!scene || scene !== this._assignedScene) {
        if (this._assignedScene) {
          this._assignedScene.removeElement(this);
          this._assignedScene = null;
        }
      }

      if (scene) {
        scene.addElement(this);
        this._assignedScene = scene;
      }
    }
  }

  componentWillUnmount() {
    if (this._assignedScene) {
      this._assignedScene.removeElement(this);
    }
  }

  group() {
    return this._group;
  }

  render() {
    return (
      <SceneContext.Consumer
        children={this._updateAssignment}
      />
    );
  }
}

export {
  SimulationScene,
  SimluationSceneElement
};

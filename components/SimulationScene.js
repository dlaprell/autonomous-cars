/** @jsx h */

import { Scene, Group, AmbientLight, PointLight } from 'three';
import { h, Component, createContext } from 'preact';

import { SimulationRenderer } from './SimulationRenderer';

const SceneContext = createContext(null);

class SimluationScene extends Component {
  constructor(...args) {
    super(...args);

    this._scene = new Scene();

    var ambientLight = new AmbientLight(0xA0A0A0, 0.5); // soft white light
    this._scene.add(ambientLight);

    var spotLight = new PointLight( 0xffffff, 0.6);
    spotLight.position.set(-150, 500, 200);
    spotLight.castShadow = true;

    this._scene.add(spotLight);
    
    this._updateableElements = new Set();

    const {
      background
    } = this.props;

    if (background) {
      this._scene.background = background;
    }

    this._camera = null;
  }

  update(time, delta, rest) {
    for (const e of this._updateableElements.values()) {
      e.update(time, delta, rest);
    }

    this._camera = rest.camera;
    rest.renderer.render(this._scene, rest.camera);
  }

  addElement(e) {
    this._scene.add(e.group());

    if (typeof e.update === 'function') {
      this._updateableElements.add(e);
    }
  }

  removeElement(e) {
    this._scene.remove(e.group());

    this._updateableElements.delete(e);
  }
  
  render() {
    const { children, loop, creatorView } = this.props;

    return (
      <SceneContext.Provider value={this}>
        {children}

        <SimulationRenderer
          creatorView={creatorView}
          loop={Boolean(loop)}
          onUpdate={this.update.bind(this)}
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

  // update(time, renderer, camera) {
  //
  // }

  render() {
    return (
      <SceneContext.Consumer
        children={this._updateAssignment}
      />
    );
  }
}

export {
  SimluationScene,
  SimluationSceneElement
};

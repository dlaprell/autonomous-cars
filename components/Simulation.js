/** @jsx h */

import { h, Component } from 'preact';
import { CubeTextureLoader } from 'three';

import { GridMap } from './src/grid';

import { SimulationScene } from './SimulationScene';
import { Ground, GridRenderer } from './World';
import { MovingCar, TrafficManager } from './Vehicles';
import { OrbitControls } from './OrbitControls';
import { RandomGen } from './src/randomgen';

import { ModelManager } from './ModelManager';
import loadModels from './models/ModelLoader';

import cloudsNorthPath from '../static/images/clouds1/clouds1_north.jpg';
import cloudsSouthPath from '../static/images/clouds1/clouds1_south.jpg';
import cloudsUpPath from '../static/images/clouds1/clouds1_up.jpg';
import cloudsDownPath from '../static/images/clouds1/clouds1_down.jpg';
import cloudsWestPath from '../static/images/clouds1/clouds1_west.jpg';
import cloudsEastPath from '../static/images/clouds1/clouds1_east.jpg';
import { assert } from './utils/assert';

class Simulation extends Component {
  constructor(...args) {
    super(...args);

    this.state = {
      loaded: Boolean(this.props.models),
      progress: 0,
      stop: false
    };

    this._random = new RandomGen();

    this._grid = null;

    this._background = new CubeTextureLoader()
      .load([
        cloudsNorthPath,
        cloudsSouthPath,
        cloudsUpPath,
        cloudsDownPath,
        cloudsWestPath,
        cloudsEastPath
      ]);

    this.handleTimeUpdate = this.handleTimeUpdate.bind(this);
  }

  componentDidMount() {
    if (this.state.loaded) {
      return;
    }

    console.warn('Falling back to loading the models on the fly. This is not optimal!');

    loadModels({
      onLoad: (models) => {
        this.setState({ loaded: true, models });
      },

      onProgress: (_, finished, total) => {
        this.setState({ progress: finished / total });
      },

      onError: (err) => {
        console.error(err);
      }
    });
  }

  handleTimeUpdate(time) {
    const { stopAfter, onStop } = this.props;

    if (typeof stopAfter === 'number' && stopAfter > 0 && time >= stopAfter && !this.state.stop) {
      this.setState({ stop: true });

      if (onStop) {
        onStop();
      }
    }
  }

  render() {
    const {
      withCamera,
      withTraffic,
      world,
      container,
      sceneRef,

      preLoadedGrid,

      creatorView,
      highlightTile,
      renderOptions,

      timeProvider,

      vr
    } = this.props;

    const {
      loaded,
      stop
    } = this.state;

    let models = this.props.models || this.state.models || null;

    assert(Boolean(models) === Boolean(loaded));

    if (!loaded) {
      return null;
    }

    if (this._grid === null || this._gridMap !== world.map) {
      if (this._grid) {
        this._grid.updateBaseMap(world.map);
        this._grid.ensureReady();
      } else if (preLoadedGrid) {
        this._grid = preLoadedGrid;
        preLoadedGrid.ensureReady();
      } else {
        this._grid = new GridMap(
          models,
          {
            asyncInit: false,
            baseMap: world.map,
            creatorView
          }
        );
      }

      this._gridMap = world.map;
    }

    this._grid.highlightTile(highlightTile || null);

    const orbitControls = Boolean(withCamera && !vr);

    return (
      <ModelManager models={models}>
        <SimulationScene
          vr={Boolean(vr)}

          timeProvider={timeProvider || null}

          background={this._background}
          loop={loaded && !stop}
          ref={sceneRef}
          creatorView={creatorView}
          onTimeUpdate={this.handleTimeUpdate}

          renderOptions={renderOptions || {}}
        >
          {orbitControls && (
            <OrbitControls enabled={orbitControls} container={container} />
          )}

          {withTraffic && (
            <TrafficManager>
              {world.cars.map(({ following, movement, options, startOffset }) => (
                <MovingCar
                  grid={this._grid}
                  random={this._random}

                  startOffset={startOffset || 0}
                  movement={movement}
                  options={options || {}}

                  vr={vr}
                  following={Boolean((!withCamera || vr) && following)}
                />
              ))}
            </TrafficManager>
          )}

          <Ground grid={this._grid} />
          <GridRenderer grid={this._grid} />
        </SimulationScene>
      </ModelManager>
    );
  }
}

export {
  Simulation
};
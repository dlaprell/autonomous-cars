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

import cloudsNorthPath from 'url:../static/images/clouds1/clouds1_north.jpg';
import cloudsSouthPath from 'url:../static/images/clouds1/clouds1_south.jpg';
import cloudsUpPath from 'url:../static/images/clouds1/clouds1_up.jpg';
import cloudsDownPath from 'url:../static/images/clouds1/clouds1_down.jpg';
import cloudsWestPath from 'url:../static/images/clouds1/clouds1_west.jpg';
import cloudsEastPath from 'url:../static/images/clouds1/clouds1_east.jpg';

class Simulation extends Component {
  constructor(...args) {
    super(...args);

    this.state = {
      loaded: false,
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
    })
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

      creatorView,
      highlightTile,
      renderOptions,

      timeProvider,

      vr
    } = this.props;

    const {
      loaded,
      models,
      stop
    } = this.state;

    if (!loaded) {
      return null;
    }

    if (this._grid === null || this._gridMap !== world.map) {
      if (this._grid) {
        this._grid.updateBaseMap(world.map);
      } else {
        this._grid = new GridMap(
          models,
          {
            withLanes: withTraffic && !creatorView,
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
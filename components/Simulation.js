/** @jsx h */

import { h, Component, Fragment } from 'preact';
import { CubeTextureLoader } from 'three';

import { initTiles } from './src/grid';

import { SimluationScene } from './SimulationScene';
import { Ground, GridRenderer } from './World';
import { MovingCar, TrafficManager } from './Vehicles';
import { OrbitControls } from './OrbitControls';
import { RandomGen } from './src/randomgen';

import { ModelManager } from './ModelManager';
import loadModels from './models/ModelLoader';

function Wrapper({ children }) {
  return (
    <Fragment>
      {children}
    </Fragment>
  );
}

class Simulation extends Component {
  constructor(...args) {
    super(...args);

    this.state = {
      loaded: false,
      progress: 0
    };

    this._random = new RandomGen();

    this._grid = null;

    this._background = new CubeTextureLoader()
      .setPath('/images/clouds1/')
      .load([
        'clouds1_north.jpg',
        'clouds1_south.jpg',
        'clouds1_up.jpg',
        'clouds1_down.jpg',
        'clouds1_west.jpg',
        'clouds1_east.jpg'
      ]);
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
  
  render() {
    const {
      withCamera,
      withTraffic,
      baseMap,
      world,
      container,
      sceneRef,
      
      creatorView,

      vr
    } = this.props;

    const {
      loaded,
      models
    } = this.state;

    if (!loaded) {
      return null;
    }

    if (this._grid === null || this._gridMap !== baseMap) {
      this._grid = initTiles(this._random, models, {
        withLanes: withTraffic,
        baseMap: world.map,
        drawBorders: creatorView
      });
      this._gridMap = world.map;
    }

    return (
      <ModelManager models={models}>
        <SimluationScene
          vr={Boolean(vr)}

          background={this._background}
          loop={loaded}
          ref={sceneRef}
          creatorView={creatorView}
        >
          <OrbitControls enabled={withCamera && !vr} container={container} />

          <Wrapper key={this._grid.id()}>
            {withTraffic && (
              <TrafficManager>
                {world.cars.map(({ initial, following, movement }) => (
                  <MovingCar
                    grid={this._grid}
                    random={this._random}
                    initial={initial}
                    vr={vr}
                    following={(!withCamera || vr) && following}
                  />
                ))}
              </TrafficManager>
            )}
            <Ground grid={this._grid} />
            <GridRenderer grid={this._grid} />
          </Wrapper>
        </SimluationScene>
      </ModelManager>
    );
  }
}

export {
  Simulation
};
/** @jsx h */

import { h, Component } from 'preact';
import { CubeTextureLoader } from 'three';

import { initTiles } from './src/grid';
import { GridMovementPath } from './src/movement';

import { SimluationScene } from './SimulationScene';
import { Ground, GridRenderer } from './World';
import { MovingCar } from './Vehicles';
import { OrbitControls } from './OrbitControls';
import { RandomGen } from './src/randomgen';

import { ModelManager } from './ModelManager';
import loadModels from './models/ModelLoader';

class Simulation extends Component {
  constructor(...args) {
    super(...args);

    this.state = {
      loaded: false,
      progress: 0
    };

    this._random = new RandomGen();

    this._grid = initTiles(this._random);

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
        console.log(models);

        this.setState({ loaded: true });
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
    const { loaded, models } = this.state;

    const withCamera = false;

    if (!loaded) {
      return null;
    }

    return (
      <ModelManager models={models}>
        <SimluationScene
          background={this._background}
          loop={loaded}
        >
          <OrbitControls enabled={withCamera} />

          <MovingCar
            grid={this._grid}
            initial={[ 0, 0 ]}
            random={this._random}
            following={!withCamera}
          />

          <MovingCar
            grid={this._grid}
            speed={0.01}
            initial={[ 2, 3 ]}
            random={this._random}
          />

          <MovingCar
            grid={this._grid}
            initial={[ 4, 0 ]}
            random={this._random}
          />

          <MovingCar
            grid={this._grid}
            speed={0.01}
            initial={[ 1, 3 ]}
            random={this._random}
          />

          <MovingCar
            grid={this._grid}
            initial={[ 0, 4 ]}
            random={this._random}
          />

          <MovingCar
            grid={this._grid}
            speed={0.01}
            initial={[ 0, 2 ]}
            random={this._random}
          />

          <Ground grid={this._grid} />
          <GridRenderer grid={this._grid} />
        </SimluationScene>
      </ModelManager>
    );
  }
}

export {
  Simulation
};
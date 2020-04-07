/** @jsx h */

import { h, Component } from 'preact';
import { CubeTextureLoader } from 'three';

import { initTiles } from './src/grid';

import { SimluationScene } from './SimulationScene';
import { Ground, GridRenderer } from './World';
import { MovingCar, TrafficManager } from './Vehicles';
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
    const { loaded, models } = this.state;

    const withCamera = true;

    if (!loaded) {
      return null;
    }

    if (this._grid === null) {
      this._grid = initTiles(this._random, models);
    }

    return (
      <ModelManager models={models}>
        <SimluationScene
          background={this._background}
          loop={loaded}
        >
          <OrbitControls enabled={withCamera} />

          <TrafficManager>
            <MovingCar
              grid={this._grid}
              initial={[ 0, 0 ]}
              random={this._random}
              following={!withCamera}
            />

            <MovingCar
              grid={this._grid}
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
              initial={[ 0, 2 ]}
              random={this._random}
            />

            <MovingCar
              grid={this._grid}
              initial={[ 0, 5 ]}
              random={this._random}
            />

            <MovingCar
              grid={this._grid}
              initial={[ 3, 3 ]}
              random={this._random}
            />

            <MovingCar
              grid={this._grid}
              initial={[ 3, 4 ]}
              random={this._random}
            />
            
            <MovingCar
              grid={this._grid}
              initial={[ 3, 5 ]}
              random={this._random}
            />
          </TrafficManager>

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
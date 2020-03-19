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

const path1 = new GridMovementPath(
  [ 0, 0 ], 1, [
    2, 2, 1, 0, 1, 1, 0, -1, -1, -1, 2, 2, 2, 1, 1, 1, 0, 0, -1, -1, 2, -1, 0, 0, 1, 1, 1, 2, -1, -1, 2, -1, 2, 1, 1, 1, 0, 0, 0, -1, -1, -1
  ]
);

class Simulation extends Component {
  constructor(...args) {
    super(...args);

    this._grid = initTiles();

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

    this._random = new RandomGen();
  }
  
  render() {
    return (
      <SimluationScene
        background={this._background}
      >
        <MovingCar
          grid={this._grid}
          speed={0.01}
          initial={[ 0, 0 ]}
          random={this._random}
        />

        <MovingCar
          grid={this._grid}
          speed={0.01}
          initial={[ 0, 3 ]}
          random={this._random}
        />

        <MovingCar
          grid={this._grid}
          speed={0.01}
          initial={[ 0, 1 ]}
          random={this._random}
        />

        <MovingCar
          grid={this._grid}
          speed={0.01}
          initial={[ 0, 2 ]}
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
          speed={0.01}
          initial={[ 2, 3 ]}
          random={this._random}
        />

        <MovingCar
          grid={this._grid}
          speed={0.01}
          initial={[ 3, 3 ]}
          random={this._random}
        />

        <MovingCar
          grid={this._grid}
          speed={0.01}
          initial={[ 3, 2 ]}
          random={this._random}
        />

        <MovingCar
          grid={this._grid}
          speed={0.01}
          initial={[ 3, 1 ]}
          random={this._random}
        />

        <MovingCar
          grid={this._grid}
          speed={0.01}
          initial={[ 3, 0 ]}
          random={this._random}
        />

        <MovingCar
          grid={this._grid}
          speed={0.01}
          initial={[ 2, 0 ]}
          random={this._random}
        />

        <MovingCar
          grid={this._grid}
          speed={0.01}
          initial={[ 1, 0 ]}
          random={this._random}
        />

        <OrbitControls enabled />

        <Ground grid={this._grid} />
        <GridRenderer grid={this._grid} />
      </SimluationScene>
    );
  }
}

export {
  Simulation
};
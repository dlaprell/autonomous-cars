import { h, createContext } from 'preact';

import { SimluationSceneElement } from './SimulationScene';

import { Car } from './src/car';
import { RandomMovement } from './src/movement';
import { ModelContext } from './ModelManager';
import { rotate, normalizeRotation } from './src/utils';
import { TYPES } from './src/grid_tiles';

const TrafficContext = createContext(null);

class TrafficManager extends SimluationSceneElement {
  constructor(...args) {
    super(...args);

    this._managedObjects = [];
  }

  update() {
    // So we want to check in every frame whether one car is approaching a t-section or
    // 4-four crossing ('conflict zones') and try to use the standard rules of traffic
    const vehiclesNearConflictZones = [];

    const limiter = new Map();

    // First build a grid of all positions
    const grid = {};
    function addToGrid(t, v, cur, dirs) {
      if (t.tile.getType() !== TYPES.T_SECTION) {
        return;
      }

      if (typeof grid[t.x] === 'undefined') {
        grid[t.x] = {};
      }

      if (typeof grid[t.x][t.y] === 'undefined') {
        grid[t.x][t.y] = [];
      }

      const type = t.tile.getType();
      const tRot = t.tile.getRotation();

      let action = null;
      if (type === TYPES.ROAD || type === TYPES.CURVE) {
        throw new Error('Did not expect this type');
      } else if (type === TYPES.T_SECTION) {
        const normFrom = rotate(dirs.from, -tRot);
        const normTo = rotate(dirs.to, -tRot);

        if (normFrom === 0) {
          action = normTo === 2 ? 'pass' : 'leftTurnMain';
        } else if (normFrom === 2) {
          action = normTo === 0 ? 'passNear' : 'rightTurnMain';
        } else {
          action = normTo === 0 ? 'rightTurn' : 'leftTurn';
        }
      }

      grid[t.x][t.y].push({
        vehicle: v,
        loc: cur ? 'cur' : 'next',
        tile: t,
        dirs,
        action
      });
    }
    
    for (const vehicle of this._managedObjects) {
      const mov = vehicle.movement();

      const { from, to } = mov.getCurrentTileMovement();
      const nextDir = mov.getNextTileDirections();

      const curTile = mov.currentTile();
      const next = mov.targetTile();

      addToGrid(curTile, vehicle, true, { from, to });
      addToGrid(next, vehicle, false, nextDir);
    }

    for (const [ x, cols ] of Object.entries(grid)) {
      for (const [ y, vehicles ] of Object.entries(cols)) {
        if (vehicles.length <= 1) {
          continue;
        }

        // Now we have to test the conflicts against another

        // First the current ones
        let hasCurNearPass = false;
        let hasCurFarPass = false;
        let hasCurLeftTurnSide = false;
        let hasCurRightTurnSide = false;
        let hasCurMainRightTurn = false;
        let hasCurMainLeftTurn = false;

        for (const { action, loc } of vehicles) {
          if (loc === 'cur') {
            hasCurNearPass |= action === 'passNear';
            hasCurFarPass |= action === 'pass';
            hasCurLeftTurnSide |= action === 'leftTurn';
            hasCurRightTurnSide |= action === 'rightTurn';
            hasCurMainRightTurn |= action === 'rightTurnMain';
            hasCurMainLeftTurn |= action === 'leftTurnMain';
          }
        } 

        const hasCurSide = hasCurLeftTurnSide || hasCurRightTurnSide;
        const hasCurMainMov = hasCurFarPass || hasCurNearPass

        for (const { vehicle, action, loc } of vehicles) {
          if (loc === 'cur') {
            if (!hasCurSide) {
              continue;
            }

            if (action === 'rightTurn' && !hasCurNearPass) {
              // limiter.set(vehicle, 0);
              continue;
            }

            if (action === 'leftTurn' && !hasCurMainMov) {
              limiter.set(vehicle, 0.7);
              continue;
            }

            if (action === 'leftTurn' || action === 'rightTurn') {
              limiter.set(vehicle, 0);
              continue;
            }
          }
        }
      }
    }

    if (limiter.size > 0) {
      console.log(limiter);
    }

    for (const vehicle of this._managedObjects) {
      const mov = vehicle.movement();

      const cur = mov.speed();

      const { from, to } = mov.getCurrentTileMovement();
      const nextDir = mov.getNextTileDirections();

      const curTile = mov.currentTile().tile;
      const next = mov.targetTile().tile;

      let lim = 1;
      if (limiter.has(vehicle)) {
        lim = limiter.get(vehicle);
      }/*  else {
        if (((from + to) % 2) !== 0) {
          lim = 0.5;
        } else if (((nextDir.from + nextDir.to) % 2) !== 0) {
          lim = 0.66;
        }
      } */

      const curLimit = curTile.speedLimitation() * lim;
      const nextLimit = next.speedLimitation() * lim;

      let acc = 0;

      if (cur > curLimit) {
        acc = -0.000004;
      } else if (cur > nextLimit) {
        acc = -0.0000004;
      } else if (cur < curLimit) {
        acc =  0.0000008;
      }

      mov.setAcceleration(acc);
    }
  }

  render() {
    const { children } = this.props;

    return (
      <TrafficContext.Provider value={this._managedObjects}>
        {children}

        {super.render()}
      </TrafficContext.Provider>
    );
  }
}

class MovingCar extends SimluationSceneElement {
  constructor(...args) {
    super(...args);

    const { grid, initial, random, manager } = this.props;

    this._car = new Car(
      new RandomMovement(grid, initial, random)
    );

    manager.push(this._car);

    this._carObject = this.props.models.carPurple.clone();

    this._carObject.rotation.x -= (Math.PI / 2);
    this._carObject.rotation.z += Math.PI / 2;
    this._carObject.rotation.z += Math.PI;
    this._carObject.position.y -= 0.42;

    this.group().add(this._carObject);
  }

  update(_, delta, rest) {
    const { x, y, angle } = this._car.update(delta);

    this.group().position.x = x;
    this.group().position.z = y;
    this.group().rotation.y = -angle;

    const { following } = this.props;
    if (!following) {
      return;
    }

    const camera = rest.camera;

    camera.position.y = 0.95;
    camera.position.x = x;
    camera.position.z = y;

    const offsetX = -0.225;
    const offsetY = 1.6;

    camera.position.x += offsetX * Math.cos(angle) - offsetY * Math.sin(angle);
    camera.position.z += offsetY * Math.cos(angle) + offsetX * Math.sin(angle);

    camera.rotation.y = -angle;
    camera.rotation.x = 0;
    camera.rotation.z = 0;
    camera.rotateOnAxis({ x: 1, y: 0, z: 0 }, -1 * Math.PI * 0.01);
  }

  render() {
    return super.render();
  }
}

export function MovingCarWrapper(props) {
  return (
    <ModelContext.Consumer
      children={models => (
        <TrafficContext.Consumer
          children={m => (
            <MovingCar
              manager={m}
              models={models}
              {...props}
            />
          )}
        />
      )}
    />
  );
}

export {
  TrafficManager,
  MovingCarWrapper as MovingCar
};
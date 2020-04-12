import { h, createContext } from 'preact';
import { Color } from 'three';

import { SimluationSceneElement } from './SimulationScene';

import { Car } from './src/car';
import { RandomMovement } from './src/movement';
import { ModelContext } from './ModelManager';
import { rotate, angle } from './src/utils';
import { TYPES } from './src/grid_tiles';
import { assert } from './utils/assert';

const ACCELERATION = {
  MAX_BRAKE: -0.000009,

  SOFT_BRAKE: -0.0000075,

  MEDIUM_ACCEL: 0.0000015,
  MAX_ACCEL: 0.000001
};

function laneDistanceUpTo(lane, tile) {
  const pos = lane._includedTilesOrder.indexOf(tile);
  let distance = 0;
  for (let i = 0; i < pos; i++) {
    distance += lane._includedTilesDistances[i];
  }

  return distance;
}

const TrafficContext = createContext(null);

class TrafficManager extends SimluationSceneElement {
  constructor(...args) {
    super(...args);

    this._managedObjects = [];
  }

  update() {
    // So we want to check in every frame whether one car is approaching a t-section or
    // 4-four crossing ('conflict zones') and try to use the standard rules of traffic
    const onLane = new Map();
    const atConflictZone = new Map();

    const acc = new Map();

    function setAcc(vehicle, acc) {
      if (!acc.has(vehicle)) {
        acc.set(vehicle, lim);
      } else {
        const a = acc.get(vehicle);
        acc.set(vehicle, Math.max(ACCELERATION.MAX_BRAKE, Math.min(a, lim)));
      }
    }

    const limiter = new Map();

    function addLimiter(vehicle, lim) {
      if (!limiter.has(vehicle)) {
        limiter.set(vehicle, lim);
      } else {
        const l = limiter.get(vehicle);
        limiter.set(vehicle, Math.max(0, Math.min(l, lim)));
      }
    }

    function addToConflictZone(tile, vehicle, distance, ahead, { from, to }) {
      let set;

      if (atConflictZone.has(tile)) {
        set = atConflictZone.get(tile);
      } else {
        set = [];
        atConflictZone.set(tile, set);
      }

      set.push({ vehicle, distance, from, to, ahead });
    }

    function addToLane(lane, distance, vehicle) {
      let queue;
      
      if (onLane.has(lane)) {
        queue = onLane.get(lane);
      } else {
        queue = [];
        onLane.set(lane, queue);
      }

      const toNext = lane._totalDistance - distance;

      queue.push({
        vehicle,
        distance,
        toNext
      });
    }

    for (const vehicle of this._managedObjects) {
      vehicle.before = [];
      const mov = vehicle.movement();

      const curTile = mov.currentTile().tile;

      const tileDistance = mov.getDistanceCurTile();
      const curDirs =  mov.getCurrentTileMovement();

      let ahead;
      let completed;

      if (curTile.getType() === TYPES.T_SECTION || curTile.getType() === TYPES.CROSS) {
        ahead = curTile.getTotalDistance(curDirs.from, curDirs.to) - tileDistance;
        completed = tileDistance;

        addToConflictZone(curTile, vehicle, tileDistance, ahead, curDirs);
      } else if (curTile.getType() === TYPES.ROAD || curTile.getType() === TYPES.CURVE) {
        const lane = curTile._lanes[curDirs.to].outgoing;
        completed = laneDistanceUpTo(lane, curTile) + tileDistance;

        ahead = lane._totalDistance - completed;

        addToLane(lane, completed, vehicle);
      }

      if (completed < 12) {
        // So if we just barely made it to the current tile, then still count this
        // vehicle also to the previous section
        const preTile = mov.previousTile().tile;

        // So if the previous one is a t-section then we
        // ignore this here, since we are no longer in the section
        if (preTile.getType() !== TYPES.T_SECTION && preTile.getType() !== TYPES.CROSS) {
          const lane = curTile._lanes[curDirs.from].incoming;
          addToLane(lane, lane._totalDistance + tileDistance, vehicle);
        }
      } else if (ahead < 12) {
        // The other case where we will reach the next tile very shortly

        const nextTile = mov.targetTile().tile;

        if (nextTile.getType() === TYPES.T_SECTION || nextTile.getType() === TYPES.CROSS) {
          const nextDirs = mov.getNextTileDirections();
          const nextStepDistance = nextTile.getTotalDistance(nextDirs.from, nextDirs.to);
          addToConflictZone(nextTile, vehicle, -ahead, nextStepDistance + ahead, nextDirs);
        } else {
          assert(nextTile.getType() === TYPES.ROAD || nextTile.getType() === TYPES.CURVE);

          const lane = nextTile._lanes[rotate(curDirs.to, 2)].incoming;
          addToLane(lane, -ahead, vehicle);
        }
      }
    }

    for (const queue of onLane.values()) {
      queue.sort((a, b) => b.distance - a.distance);

      for (let i = 1; i < queue.length; i++) {
        const { vehicle: befVehicle, distance: befDistance } = queue[i - 1];
        const { vehicle: curVehicle, distance: curDistance } = queue[i];

        curVehicle.before.push({
          delta: befDistance - curDistance,
          vehicle: befVehicle
        });
      }
    }

    for (const [ tile, vehicles ] of atConflictZone.entries()) {
      if (vehicles.length <= 1) {
        continue;
      }

      // First determine which conflicts we have here.
      // Step 1: order by destinations
      const inCenter = new Set();
      const atDest = { 0: new Set(), '-1': new Set(), 1: new Set(), 2: new Set() };
      const atBeginning = { 0: new Set(), '-1': new Set(), 1: new Set(), 2: new Set() };

      for (const d of vehicles) {
        if (d.ahead < 6) {
          atDest[d.to].add(d);
        } else if (d.distance < 4) {
          atBeginning[d.from].add(d);
        } else {
          inCenter.add(d);
        }

        d.action = angle(d.from, d.to);
      }

      const front = { 0: null, '-1': null, 1: null, 2: null };
      for (const [ side, sets ] of Object.entries(atBeginning)) {
        const sorted = [ ...sets ].sort((a, b) => a.ahead - b.ahead);
        if (sorted.length > 0) {
          front[side] = sorted[0];

          for (let i = 1; i < sorted.length; i++) {
            const { vehicle: befVehicle, distance: befDistance } = sorted[i - 1];
            const { vehicle: curVehicle, distance: curDistance } = sorted[i];

            curVehicle.before.push({
              delta: befDistance - curDistance,
              vehicle: befVehicle
            });
          }
        }
      }

      const blocked = [];

      for (const d of vehicles) {
        if (atDest[d.to].has(d)) {
          continue;
        } else if (inCenter.has(d)) {
          if (atDest[d.to].size > 0) {
            // TODO: make this vehicle just follow the other in front of it
            addLimiter(d.vehicle, 0);
          }
          continue;
        } else if (atBeginning[d.from].has(d)) {
          if (front[d.from] !== d) {
            continue;
          }

          for (const c of inCenter) {
            if (c.from === d.from) {
              const delta = c.distance - d.distance;
              d.vehicle.before.push({
                vehicle: c.vehicle,
                delta
              });
              continue;
            }

            const ang = angle(d.from, c.from);

            if (ang === 2 && c.action === d.action) {
              continue;
            }

            if (d.action === 2 && c.action !== -1 && ang === -1) {
              continue;
            }

            if (d.action === -1 && c.action !== 2 && ang === 1) {
              continue;
            }

            // so this vehicle is at the front, but cannot currently drive
            // into the intersection -> make it stop just before the entrance
            blocked.push(d);
            d.blockedByCenter = true;
            break;
          }

          if (d.action === -1) { // right turn
            // Check for:
            // - one that is before us (aka all that drive to the same direction)
            continue;
          } else if (d.action === 2) { // straight
            // Check for:
            // - all from the right side
            if (front[rotate(d.from, -1)]) {
              blocked.push(d);
              d.blockedByFront = true;
              continue;
            }
          } else /* d.action === 1 */ { // left turn
            // Check for:
            // - straight: straight + right
            // - right: left, straight
            const st = front[rotate(d.from, 2)];
            if (st && st.angle !== 1) {
              blocked.push(d);
              d.blockedByFront = true;
              continue;
            }

            const ri = front[rotate(d.from, -1)];
            if (ri && ri.angle !== -1) {
              blocked.push(d);
              d.blockedByFront = true;
              continue;
            }
          }
        } else {
          assert(0);
        }
      }

      for (const d of blocked) {
        if (d.blockedByFront || d.blockedByCenter) {
          if (d.distance < -3) {
            addLimiter(d.vehicle, 0.1);
          } else {
            addLimiter(d.vehicle, 0);
          }
        }
      }
    }

    for (const vehicle of this._managedObjects) {
      const mov = vehicle.movement();

      const cur = mov.speed();

      const ownSpeed = mov.scaledSpeed();

      // So we want to check if we need to brake because in front of us
      // is another vehicle that we otherwise might drive into
      let acc = ACCELERATION.MEDIUM_ACCEL;
      for (const { delta, vehicle: other } of vehicle.before) {
        const desiredDistance = Math.max(8, ownSpeed / 2);

        const factor = desiredDistance / delta;
        if (factor > 2.5) {
          acc = Math.min(acc, ACCELERATION.MAX_BRAKE)
          break;
        } else if  (factor > 1.1) {
          acc = Math.min(acc, ACCELERATION.SOFT_BRAKE);
        }
      }

      const { from, to } = mov.getCurrentTileMovement();
      const nextDir = mov.getNextTileDirections();

      const curTile = mov.currentTile().tile;
      const nextTile = mov.targetTile().tile;

      const lim = limiter.has(vehicle) ? limiter.get(vehicle) : 1;
      let tileSpeedLimit = curTile.speedLimitation() * lim;

      if (nextTile.getType() === TYPES.T_SECTION || nextTile.getType() === TYPES.CROSS) {
        tileSpeedLimit = Math.min(tileSpeedLimit, 0.0075);
      } else if (((from + to) % 2) !== 0) {
        tileSpeedLimit = Math.min(tileSpeedLimit, 0.008);
      } else if (((nextDir.from + nextDir.to) % 2) !== 0) {
        tileSpeedLimit = Math.min(tileSpeedLimit, 0.009);
      }

      if (cur > tileSpeedLimit) {
        acc = Math.min(acc, ACCELERATION.SOFT_BRAKE);
      }

      if (cur < 0) {
        acc = 0;
        mov._speed = 0;
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

const colors = [
  '#fcba03',
  '#ebebeb',
  '#008dd4',
  '#00b05b',
  '#8900ba'
];

function adaptCar(car, color) {
  car.traverse((child) => {
    if (child.isMesh) {
      if (child.name === 'Car_Model') {
        child.material = child.material.clone();
        child.material.color = new Color(color);
      }

      if (child.name === 'Car_Windows') {
        child.material.transparent = true;
        child.material.opacity = 0.5;
      }
    }
  });
}

class MovingCar extends SimluationSceneElement {
  constructor(...args) {
    super(...args);

    const { grid, initial, random, manager } = this.props;

    const { tile } = grid.getTileAt(...initial);
    assert(tile.entranceSides().length > 0);

    this._car = new Car(
      new RandomMovement(grid, initial, random)
    );

    manager.push(this._car);

    this._carObject = this.props.models.carBaseHuman.clone();

    const color = colors[random.integer(0, colors.length - 1)];
    adaptCar(this._carObject, color);

    this._carObject.position.y += 0.2;
    this._carObject.rotation.y += -Math.PI / 2;

    this.group().add(this._carObject);
  }

  update(_, delta, rest) {
    const { x, y, angle } = this._car.update(delta);

    this.group().position.x = x;
    this.group().position.z = y;
    this.group().rotation.y = -angle;

    const { following, vr } = this.props;
    if (!following) {
      return;
    }

    let camX = x;
    const camY = vr ? -0.4 : 1.2;
    let camZ = y;

    const offsetX = -0.25;
    const offsetY = vr ? 0 : 0.75;

    camX += offsetX * Math.cos(angle) - offsetY * Math.sin(angle);
    camZ += offsetY * Math.cos(angle) + offsetX * Math.sin(angle);

    rest.updateCameraPosition(camX, camY, camZ);

    if (vr) {
      rest.updateCameraRotation(null, -angle, null);
    } else {
      const camera = rest.camera;
      camera.rotation.y = -angle;
      camera.rotation.x = 0;
      camera.rotation.z = 0;
      camera.rotateOnAxis({ x: 1, y: 0, z: 0 }, -1 * Math.PI * 0.04);
    }
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
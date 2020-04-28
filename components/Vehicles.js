import { h, createContext } from 'preact';
import { Color } from 'three';

import { SimluationSceneElement } from './SimulationScene';

import { RandomMovement, PathMovement } from './src/movement';
import { ModelContext } from './ModelManager';
import { rotate, angle } from './src/utils';
import { TYPES } from './src/grid_tiles';
import { assert } from './utils/assert';
import { RandomGen } from './src/randomgen';

const ACCELERATION = {
  MAX_BRAKE: -8,
  MEDIUM_BRAKE: -6.5,
  SOFT_BRAKE: -5,

  MEDIUM_ACCEL: 1.75,
  MAX_ACCEL: 2.5
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

    this._internalTime = 0;
  }

  calculateAccelerations() {
    // So we want to check in every frame whether one car is approaching a t-section or
    // 4-four crossing ('conflict zones') and try to use the standard rules of traffic

    for (const vehicle of this._managedObjects) {
      vehicle.haltIn = Number.MAX_SAFE_INTEGER;
    }

    const onLane = new Map();
    const atConflictZone = new Map();

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

    for (const vehicles of atConflictZone.values()) {
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

      const last = { 0: null, '-1': null, 1: null, 2: null };
      for (const [ side, sets ] of Object.entries(atDest)) {
        const sorted = [ ...sets ].sort((a, b) => a.ahead - b.ahead);
        if (sorted.length > 0) {
          last[side] = sorted[sorted.length - 1];

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
          const lastAtDest = last[d.to];
          if (lastAtDest !== null) {
            // So we have to calculate the distance between both of these.
            // While the `ahead` distance of both might not be perfect, it is
            // the best one that can be easily calculated
            d.vehicle.before.push({
              vehicle: lastAtDest.vehicle,
              delta: d.ahead - lastAtDest.ahead
            });
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
          // distance = 1 is the halt line
          const distanceToHaltLine = Math.max(0, 1 - d.distance);
          d.vehicle.haltIn = Math.min(d.vehicle.haltIn, distanceToHaltLine);
        }
      }
    }

    for (const vehicle of this._managedObjects) {
      const mov = vehicle.movement();

      const ownSpeed = mov.speed();

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

      if (vehicle.haltIn < Number.MAX_SAFE_INTEGER) {
        // Since the acceleration is in m/s^2 we have to convert the speed to m/s
        const convSpeed = mov.speedInMPerS();

        const brakingDistance = Math.pow(convSpeed, 2) / (-2 * ACCELERATION.MEDIUM_BRAKE);

        if (brakingDistance - 3 > vehicle.haltIn) {
          acc = Math.min(acc, ACCELERATION.MAX_BRAKE);
        } else if (brakingDistance + 1 > vehicle.haltIn) {
          acc = Math.min(acc, ACCELERATION.MEDIUM_BRAKE);
        }
      }

      const { from, to } = mov.getCurrentTileMovement();
      const nextDir = mov.getNextTileDirections();

      const curTile = mov.currentTile().tile;
      const nextTile = mov.targetTile().tile;

      let tileSpeedLimit = curTile.speedLimitation();

      if (nextTile.getType() === TYPES.T_SECTION || nextTile.getType() === TYPES.CROSS) {
        tileSpeedLimit = Math.min(tileSpeedLimit, 25);
      } else if (((from + to) % 2) !== 0) {
        tileSpeedLimit = Math.min(tileSpeedLimit, 20);
      } else if (((nextDir.from + nextDir.to) % 2) !== 0) {
        tileSpeedLimit = Math.min(tileSpeedLimit, 25);
      }

      if (ownSpeed > tileSpeedLimit) {
        acc = Math.min(acc, ACCELERATION.SOFT_BRAKE);
      }

      if (ownSpeed < 0) {
        acc = 0;
        mov._speed = 0;
      }

      mov.setAcceleration(acc);
    }
  }

  updateVisualization(rest) {
    for (const vehicle of this._managedObjects) {
      vehicle.updateVisualization(rest);
    }
  }

  updateTime(_, delta) {
    // So we want to update the position continuosly, but only calculate the acceleration
    // and movement patterns in a fixed pattern (e.g every 20ms)
    while (delta > 0) {
      const toNextAccUpdate = 20 - (this._internalTime % 20);

      if (toNextAccUpdate === 20) {
        this.calculateAccelerations();
      }

      const updateDelta = Math.min(toNextAccUpdate, delta);
      delta -= updateDelta;

      for (const vehicle of this._managedObjects) {
        vehicle.updatePosition(updateDelta);
      }

      this._internalTime += updateDelta;
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
  const objs = {};

  car.traverse((child) => {
    if (!child.isMesh) {
      return;
    }

    if (child.name === 'Car_Model') {
      child.material = child.material.clone();
      child.material.color = new Color(color);

      objs.car = child;
    }

    if (child.name === 'Car_Windows') {
      child.material.transparent = true;
      child.material.opacity = 0.6;

      objs.windows = child;
    }

    if (child.name === 'Human_BaseMesh') {
      objs.driver = child;
    }

    if (child.name === 'Car_Front_Seats') {
      objs.frontSeats = child;
    }
  });

  return objs;
}

class MovingCar extends SimluationSceneElement {
  constructor(...args) {
    super(...args);

    const { grid, manager, random, movement, options, following } = this.props;

    this._movement = null;
    if (movement.type === 'random') {
      this._movement = new RandomMovement(
        grid,
        movement.initial,
        new RandomGen(movement.seed)
      );
    } else if (movement.type === 'path') {
      this._movement = new PathMovement(
        grid,
        movement.initial,
        movement.path
      );
    }

    assert(this._movement && this._movement.currentTile().tile.entranceSides().length > 0);

    const curTile = this._movement.currentTile().tile;
    this._movement._speed = Math.min(options.initialSpeed || 0, curTile.speedLimitation());

    manager.push(this);

    this._carObject = this.props.models.carBaseHuman.clone();

    const color = options.color || colors[random.integer(0, colors.length - 1)];
    const { driver, frontSeats, windows } = adaptCar(this._carObject, color);

    if (options.noDriver) {
      driver.visible = false;
    }

    if (following) {
      windows.visible = false;
      frontSeats.visible = false;
    }

    this._carObject.position.y += 0.2;
    this._carObject.rotation.y += -Math.PI / 2;

    this.group().add(this._carObject);

    this._initialUpdate = true;
  }

  movement() {
    return this._movement;
  }

  updateVisualization(rest) {
    const x = this._movement.getX();
    const y = this._movement.getY();
    const angle = this._movement.getAngle();
    const sangle = this._movement.getSmoothedAngle();

    this.group().position.x = x;
    this.group().position.z = y;
    this.group().rotation.y = -angle;

    const { following, vr } = this.props;
    if (!following) {
      return;
    }

    let camX = x;
    const camY = vr ? -0.4 : 1.25;
    let camZ = y;

    const offsetX = vr ? -0.25 : -0.3;
    const offsetY = vr ? 0 : 0.3;

    camX += offsetX * Math.cos(angle) - offsetY * Math.sin(angle);
    camZ += offsetY * Math.cos(angle) + offsetX * Math.sin(angle);

    rest.updateCameraPosition(camX, camY, camZ);

    if (vr) {
      rest.updateCameraRotation(null, -angle, null);
    } else {
      const camera = rest.camera;
      camera.rotation.y = -sangle;
      camera.rotation.x = 0;
      camera.rotation.z = 0;
      camera.rotateOnAxis({ x: 1, y: 0, z: 0 }, -1 * Math.PI * 0.03);
    }
  }

  updatePosition(delta) {
    this._movement.update(delta);

    if (this._initialUpdate) {
      this._initialUpdate = false;

      // Apply a start offset if there is one specified
      const { startOffset } = this.props;

      if (typeof startOffset !== 'undefined' && startOffset >= 0) {
        assert(typeof startOffset === 'number');
        this._movement.update(startOffset);
      }
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
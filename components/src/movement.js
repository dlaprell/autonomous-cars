import { rotate } from './utils';
import { assert } from '../utils/assert';
import { TYPES } from './grid_tiles';

class GridMovementBase {
  constructor(grid) {
    this._grid = grid;

    this._x = 0;
    this._y = 0;
    this._angle = 0;

    this._speed = 0;
    this._acceleration = 0;

    this._internalTime = 0;
    this._tileTime = 0;

    this._tileDistance = 0;
  }

  getDistanceCurTile() {
    return this._tileDistance;
  }

  // Should be in the form of meter per second^2
  setAcceleration(acc) {
    assert(!isNaN(acc));
    this._acceleration = acc;
  }

  speed() {
    return this._speed; // in km / h
  }

  _addSpeedM_S(speedInM_S) {
    this._speed += (speedInM_S / 1000) * 60 * 60;
  }

  getX() {
    return this._x;
  }

  getY() {
    return this._y;
  }

  getAngle() {
    return this._angle;
  }

  /** @returns Grid */
  grid() {
    return this._grid;
  }

  previousTile() {
    const { tile, from } = this.getCurrentTileMovement();

    const [ x, y ] = this._grid.getRelativeFrom(tile[0], tile[1], from);
    return this._grid.getTileAt(x, y);
  }

  currentTile() {
    const { tile } = this.getCurrentTileMovement();
    return this._grid.getTileAt(tile[0], tile[1]);
  }

  targetTile() {
    const { to, tile } = this.getCurrentTileMovement();

    const [ x, y ] = this._grid.getRelativeFrom(tile[0], tile[1], to);
    return this._grid.getTileAt(x, y);
  }

  getNextTileDirections() {
    // Implement!
    return null;
  }

  getCurrentTileMovement() {
    // Implement!
    return null;
  }

  useNextTile() {
    // Implement!
  }

  update(timeDeltaMs) {
    const baseSpeed = this._speed;

    const timeDelta = timeDeltaMs / 1000.0;

    // Meter per second in scaled form
    const speedScaled = (baseSpeed * 1000) / (60 * 60);

    // Meter
    const deltaDistance = speedScaled * timeDelta +
      (0.5 * this._acceleration * Math.pow(timeDelta, 2));

    const distance = this._tileDistance + deltaDistance;

    assert(!isNaN(distance));

    const {
      from,
      to,
      tile: [ xTile, yTile ]
    } = this.getCurrentTileMovement();

    const { tile } = this._grid.getTileAt(xTile, yTile);
    const updatedPos = tile.interpolerateMovement(from, to, distance);

    if (updatedPos.overshoot > 0) {
      this.useNextTile();

      this._tileTime = 0;
      this._tileDistance = 0;

      let neededTime = NaN;

      if (this._acceleration == 0) {
        // So there was no acceleration and we can use the basic speed and time
        // equotations
        neededTime = (deltaDistance / (1 / this._speed));
      } else {
        // This one is a bit more complex since we have to account for the acceleration
        // during the movement
        const o = Math.sqrt(Math.pow(speedScaled, 2) + 2 * this._acceleration * deltaDistance);
        const res = [
          (-speedScaled + o) / this._acceleration,
          (-speedScaled - o) / this._acceleration
        ];

        neededTime = Math.min(...res.filter(x => x >= 0));

        this._addSpeedM_S(this._acceleration * (timeDelta - neededTime));

        if (this._speed < 0) {
          this._speed = 0;
        }
      }

      this._internalTime += (timeDelta - neededTime);

      assert(neededTime * 0.95 < timeDelta);

      this.update(neededTime / 1000);
    } else {
      const [ tileX, tileY ] = this._grid.getTileAnchorPosition(xTile, yTile);

      this._x = tileX + updatedPos.x;
      this._y = tileY + updatedPos.y;
      this._angle = updatedPos.angle;

      this._addSpeedM_S(this._acceleration * timeDelta);
      this._tileDistance = distance;
      this._tileTime += timeDeltaMs;
      this._internalTime += timeDeltaMs;
    }
  }
}

class RandomMovement extends GridMovementBase {
  constructor(grid, initialTile, random) {
    super(grid);

    this._random = random;

    this._currentTile = initialTile;
    this._from = this.randomFrom(initialTile[0], initialTile[1]);

    const to = this.randomTo(initialTile[0], initialTile[1], this._from);
    const next = this.randomTo(
      ...grid.getRelativeFrom(initialTile[0], initialTile[1], to),
      rotate(to, 2)
    );

    this._nextSteps = [
      to,
      next
    ];
  }

  randomFrom(x, y) {
    const { tile } = this.grid().getTileAt(x, y);
    const sides = tile.entranceSides();

    return sides[this._random.integer(0, sides.length - 1)];
  }

  randomTo(x, y, from) {
    const { tile } = this.grid().getTileAt(x, y);
    const sides = tile.exitSides().filter(x => x !== from);

    return sides[this._random.integer(0, sides.length - 1)];
  }

  getCurrentTileMovement() {
    // const {
    //   from,
    //   to,
    //   tile: [ xTile, yTile ]
    // } = this._path.current();

    return {
      from: this._from,
      to: this._nextSteps[0],
      tile: this._currentTile
    };
  }

  getNextTileDirections() {
    return {
      from: rotate(this._nextSteps[0], 2),
      to: this._nextSteps[1]
    };
  }

  useNextTile() {
    const [ x, y ] = this._currentTile;
    const [ reached, newDir ] = this._nextSteps;

    const nT = this.grid().getRelativeFrom(x, y, reached);

    // Update tile to the next in line
    this._currentTile = nT;
    this._from = rotate(reached, 2);

    const [ nX, nY ] = this.grid().getRelativeFrom(nT[0], nT[1], newDir);
    const futureDir = this.randomTo(nX, nY, rotate(newDir, 2));

    this._nextSteps = [ newDir, futureDir ];
  }
}

class PathMovement extends GridMovementBase {
  constructor(grid, initial, path) {
    super(grid);

    assert(path && path.length > 0);

    this._initial = initial;
    const initialTile = grid.getTileAt(...initial).tile;
    assert(initialTile && initialTile.entranceSides().length > 0);

    this._initialFrom = initialTile
      .entranceSides()
      .filter(s => s !== path[0])
      [0];

    this._path = path;
    this._current = {
      tile: initial,

      from: this._initialFrom,
      to: path[0]
    };

    this._currentIndex = 0;

    const [ nextX, nextY ] = grid.getRelativeFrom(initial[0], initial[1], path[0]);
    this._nextTile = grid.getTileAt(nextX, nextY).tile;
  }

  getCurrentTileMovement() {
    return this._current;
  }

  getNextTileDirections() {
    const from = rotate(this._current.to, 2);

    const to = (this._nextTile.getType() === TYPES.ROAD || this._nextTile.getType() === TYPES.CURVE)
      ? this._nextTile.exitSides().filter(s => s !== from)[0]
      : this._path[this._currentIndex + 1];

    assert(from >= -1 && from <= 2);
    assert(to >= -1 && to <= 2);

    return { from, to };
  }

  useNextTile() {
    const nextIsPredefined = this._nextTile.getType() === TYPES.ROAD || this._nextTile.getType() === TYPES.CURVE;

    if (!nextIsPredefined) {
      this._currentIndex++;
    }

    const curTile = this._current.tile;
    const curTo = this._current.to;

    const from = rotate(curTo, 2);
    const to = nextIsPredefined
      ? this._nextTile.exitSides().filter(s => s !== from)[0]
      : this._path[this._currentIndex];

    this._current = {
      tile: this._grid.getRelativeFrom(curTile[0], curTile[1], curTo),

      from,
      to
    };

    const next = this._grid.getRelativeFrom(this._current.tile[0], this._current.tile[1], to);
    this._nextTile = this._grid.getTileAt(...next).tile;
  }
}

// This is the actual class that does the grid movement calculations
class GridMovement {
  constructor(grid, path) {
    this._path = path;
    this._grid = grid;

    this._x = 0;
    this._y = 0;
    this._angle = 0;

    this._speed = 0;
    this._acceleration = 0;

    this._internalTime = 0;
    this._tileTime = 0;

    this._tileDistance = 0;
  }

  setAcceleration(acc) {
    this._acceleration = acc;
  }

  getX() {
    return this._x;
  }

  getY() {
    return this._y;
  }

  getAngle() {
    return this._angle;
  }

  moveBy(amount) {
    assert(!isNaN(amount));

    do {
      const {
        from,
        to,
        tile: [ xTile, yTile ]
      } = this._path.current();

      this._tileDistance += amount;
      assert(!isNaN(this._tileDistance));

      const { tile } = this._grid.getTileAt(xTile, yTile);
      const updatedPos = tile.interpolerateMovement(from, to, this._tileDistance);

      if (updatedPos.overshoot > 0) {
        // So we finished the current tile and have still some
        // distance left. Update the current tile position and move
        // on the next one further
        amount = updatedPos.overshoot;
        this._path.next();
        this._tileTime = 0;
        this._tileDistance = 0;
        continue;
      }

      const [ tileX, tileY ] = this._grid.getTileAnchorPosition(xTile, yTile);

      this._x = tileX + updatedPos.x;
      this._y = tileY + updatedPos.y;
      this._angle = updatedPos.angle;

      this._tileDistance += amount;
    } while (amount > 0);
  }

  update(timeDeltaMs) {
    const deltaDistance = this._speed * timeDeltaMs +
      (0.5 * this._acceleration * Math.pow(timeDeltaMs, 2));

    this.moveBy(deltaDistance);

    this._speed += this._acceleration * timeDeltaMs;
    this._tileTime += timeDeltaMs;
    this._internalTime += timeDeltaMs;
  }
}

export {
  GridMovement,

  PathMovement,
  RandomMovement
};
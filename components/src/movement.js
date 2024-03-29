// @ts-check

import { rotate, getRelativeFrom } from './utils';
import { assert } from '../utils/assert';
import { TYPES } from './grid_tiles';

class GridMovementBase {
  constructor(grid) {
    this._grid = grid;

    this._baseTileX = 0;
    this._baseTileY = 0;

    this._x = 0;
    this._y = 0;
    this._angle = 0;
    this._smoothedAngle = 0;

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

  speedInMPerS() {
    return (this._speed * 1000) / (60 * 60);
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

  getSmoothedAngle() {
    return this._smoothedAngle;
  }

  /** @returns Grid */
  grid() {
    return this._grid;
  }

  previousTile() {
    const { tile, from } = this.getCurrentTileMovement();

    const [ x, y ] = getRelativeFrom(tile[0], tile[1], from);
    return this._grid.getTileAt(x, y);
  }

  currentTile() {
    const { tile } = this.getCurrentTileMovement();
    return this._grid.getTileAt(tile[0], tile[1]);
  }

  targetTile() {
    const { to, tile } = this.getCurrentTileMovement();

    const [ x, y ] = getRelativeFrom(tile[0], tile[1], to);
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

  moveBy(amount) {
    assert(!isNaN(amount));

    do {
      const {
        from,
        to,
        tile: [ xTile, yTile ]
      } = this.getCurrentTileMovement();

      const isFirstMovementOnTile = this._tileDistance === 0;

      this._tileDistance += amount;
      amount = 0;

      assert(!isNaN(this._tileDistance));

      const { tile } = this._grid.getTileAt(xTile, yTile);
      const updatedPos = tile.interpolerateMovement(from, to, this._tileDistance);

      if (updatedPos.overshoot > 0) {
        // So we finished the current tile and have still some
        // distance left. Update the current tile position and move
        // on the next one further
        amount = updatedPos.overshoot;
        this.useNextTile();
        this._tileTime = 0;
        this._tileDistance = 0;
        continue;
      }

      if (isFirstMovementOnTile) {
        const [ tileX, tileY ] = this._grid.getTileAnchorPosition(xTile, yTile);
        this._baseTileX = tileX;
        this._baseTileY = tileY;
      }

      this._x = this._baseTileX + updatedPos.x;
      this._y = this._baseTileY + updatedPos.y;

      this._angle = updatedPos.angle;
      this._smoothedAngle = updatedPos.angleSmoothed;
    } while (amount > 0);
  }

  update(timeDeltaMs) {
    const baseSpeed = this._speed;

    const timeDelta = timeDeltaMs / 1000.0;

    // Meter per second in scaled form
    const speedScaled = (baseSpeed * 1000) / (60 * 60);

    // Meter
    const deltaDistance = speedScaled * timeDelta +
      (0.5 * this._acceleration * Math.pow(timeDelta, 2));

    this.moveBy(deltaDistance);

    // (m / s^2) * (s / 1000) * 60 * 60
    this._speed += ((this._acceleration * timeDelta) / 1000) * 60 * 60;
    this._tileTime += timeDeltaMs;
    this._internalTime += timeDeltaMs;
  }
}

class RandomMovement extends GridMovementBase {
  constructor(grid, initialTile, random) {
    super(grid);

    /** @type {import('./randomgen').RandomGen} */
    this._random = random;

    this._currentTile = initialTile;
    this._from = this.randomFrom(initialTile[0], initialTile[1]);

    const to = this.randomTo(initialTile[0], initialTile[1], this._from);
    const next = this.randomTo(
      ...getRelativeFrom(initialTile[0], initialTile[1], to),
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

    const nT = getRelativeFrom(x, y, reached);

    // Update tile to the next in line
    this._currentTile = nT;
    this._from = rotate(reached, 2);

    const [ nX, nY ] = getRelativeFrom(nT[0], nT[1], newDir);
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

    const [ nextX, nextY ] = getRelativeFrom(initial[0], initial[1], path[0]);
    this._nextTile = grid.getTileAt(nextX, nextY).tile;
  }

  checkNextTileExists() {
    assert(
      this._currentIndex + 1 < this._path.length,
      `The car that starts in ${this._initial} has reached the end of the path. Cur tile = ${this._current.tile}`
    );
  }

  getCurrentTileMovement() {
    return this._current;
  }

  getNextTileDirections() {
    const from = rotate(this._current.to, 2);

    const isPredefined = (this._nextTile.getType() === TYPES.ROAD || this._nextTile.getType() === TYPES.CURVE);

    if (!isPredefined) {
      this.checkNextTileExists();
    }

    const to = isPredefined
      ? this._nextTile.exitSides().filter(s => s !== from)[0]
      : this._path[this._currentIndex + 1];

    assert(from >= -1 && from <= 2);
    assert(to >= -1 && to <= 2);

    return { from, to };
  }

  useNextTile() {
    const nextIsPredefined = this._nextTile.getType() === TYPES.ROAD || this._nextTile.getType() === TYPES.CURVE;

    if (!nextIsPredefined) {
      this.checkNextTileExists();
      this._currentIndex++;
    }

    const curTile = this._current.tile;
    const curTo = this._current.to;

    const from = rotate(curTo, 2);
    const to = nextIsPredefined
      ? this._nextTile.exitSides().filter(s => s !== from)[0]
      : this._path[this._currentIndex];

    this._current = {
      tile: getRelativeFrom(curTile[0], curTile[1], curTo),

      from,
      to
    };

    const next = getRelativeFrom(this._current.tile[0], this._current.tile[1], to);
    this._nextTile = this._grid.getTileAt(...next).tile;
  }
}

export {
  PathMovement,
  RandomMovement
};
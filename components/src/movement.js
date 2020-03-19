import { rotate } from './utils';
import { initTiles } from './grid';

class GridMovementPath {
  constructor(initialTile, initialFrom, directions) {
    this._initial = initialTile;
    this._directions = directions;
  
    this._current = {
      tile: initialTile,

      from: initialFrom,
      to: this._directions[0]
    };
    this._currentIndex = 0;
  }

  current() {
    return this._current;
  }

  next() {
    this._currentIndex++;

    const old = this._current;
    this._current = {
      from: rotate(old.to, 2),
      tile: [
        old.tile[0] + (old.to % 2),
        old.tile[1] + ((old.to - 1) % 2)
      ],
      to: this._directions[this._currentIndex]
    };
  }
}

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

  setAcceleration(acc) {
    this._acceleration = acc;
  }

  setSpeed(speed) {
    this._speed = speed;
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

  peekAtTargetTile() {
    const { to, tile } = this.getCurrentTileMovement();

    return this._grid.getRelativeFrom(tile[0], tile[1], to);
  }

  getCurrentTileMovement() {
    return null;
  }

  useNextTile() {

  }

  update(timeDeltaMs) {
    const baseSpeed = this._speed;

    const deltaDistance = baseSpeed * timeDeltaMs +
      (0.5 * this._acceleration * Math.pow(timeDeltaMs, 2));

    const distance = this._tileDistance + deltaDistance;

    if (Number.isNaN(distance)) {
      debugger;
    }

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

      const o = Math.sqrt(Math.pow(baseSpeed, 2) + 2 * this._acceleration * deltaDistance);
      const res = [
        (-baseSpeed + o) / this._acceleration,
        (-baseSpeed - o) / this._acceleration
      ];

      const neededTime = Math.min(res.filter(x => x >= 0));

      this._speed += this._acceleration * (timeDeltaMs - neededTime);

      this._internalTime += (timeDeltaMs - neededTime);

      this.update(neededTime);
    } else {
      const [ tileX, tileY ] = this._grid.getTileAnchorPosition(xTile, yTile);

      this._x = tileX + updatedPos.x;
      this._y = tileY + updatedPos.y;
      this._angle = updatedPos.angle;

      this._speed += this._acceleration * timeDeltaMs;
      this._tileDistance = distance;
      this._tileTime += timeDeltaMs;
      this._internalTime += timeDeltaMs;
    }
  }
}

class RandomMovement extends GridMovementBase {
  constructor(grid, initialTile, random) {
    super(grid);

    this._random = random.derive();

    this._currentTile = initialTile;
    this._from = this.randomFrom(initialTile[0], initialTile[1]);
    this._to = this.randomTo(initialTile[0], initialTile[1], this._from);
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
      to: this._to,
      tile: this._currentTile
    };
  }

  useNextTile() {
    const [ x, y ] = this._currentTile;
    const nT = this.grid().getRelativeFrom(x, y, this._to);

    this._currentTile = nT;
    this._from = rotate(this._to, 2);
    this._to = this.randomTo(nT[0], nT[1], this._from);
  }
}

class PathMovement extends GridMovementBase {
  constructor(grid, path) {
    super(grid);

    this._path = path;
  }

  getCurrentTileMovement() {
    // const {
    //   from,
    //   to,
    //   tile: [ xTile, yTile ]
    // } = this._path.current();

    return this._path.current();
  }

  useNextTile() {
    this._path.next();
  }
}

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

  setSpeed(speed) {
    this._speed = speed;
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

  update(timeDeltaMs) {
    const baseSpeed = this._speed;

    const deltaDistance = baseSpeed * timeDeltaMs +
      (0.5 * this._acceleration * Math.pow(timeDeltaMs, 2));

    const distance = this._tileDistance + deltaDistance;

    if (Number.isNaN(distance)) {
      debugger;
    }

    const {
      from,
      to,
      tile: [ xTile, yTile ]
    } = this._path.current();

    const { tile } = this._grid.getTileAt(xTile, yTile);
    const updatedPos = tile.interpolerateMovement(from, to, distance);

    if (updatedPos.overshoot > 0) {
      this._path.next();
      this._tileTime = 0;
      this._tileDistance = 0;

      const o = Math.sqrt(Math.pow(baseSpeed, 2) + 2 * this._acceleration * deltaDistance);
      const res = [
        (-baseSpeed + o) / this._acceleration,
        (-baseSpeed - o) / this._acceleration
      ];

      const neededTime = Math.min(res.filter(x => x >= 0));

      this._speed += this._acceleration * (timeDeltaMs - neededTime);

      this._internalTime += (timeDeltaMs - neededTime);

      this.update(neededTime);
    } else {
      const [ tileX, tileY ] = this._grid.getTileAnchorPosition(xTile, yTile);

      this._x = tileX + updatedPos.x;
      this._y = tileY + updatedPos.y;
      this._angle = updatedPos.angle;

      this._speed += this._acceleration * timeDeltaMs;
      this._tileDistance = distance;
      this._tileTime += timeDeltaMs;
      this._internalTime += timeDeltaMs;
    }
  }
}

export {
  GridMovementPath,
  GridMovement,

  PathMovement,
  RandomMovement
};
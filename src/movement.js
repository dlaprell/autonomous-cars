import { rotate } from './utils';

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

class GridMovement {
  constructor(grid, path) {
    this._path = path;
    this._grid = grid;

    this._x = 0;
    this._y = 0;
    this._angle = 0;

    this._speed = 0;

    this._internalTime = 0;
    this._tileTime = 0;
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
    const distance = this._speed * (this._tileTime + timeDeltaMs);

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

      // const coveredDistance = distance - updatedPos.overshoot;
      const deltaTime = updatedPos.overshoot / this._speed;

      this._internalTime += (timeDeltaMs - deltaTime);

      this.update(deltaTime);
    } else {
      const [ tileX, tileY ] = this._grid.getTileAnchorPosition(xTile, yTile);

      this._x = tileX + updatedPos.x;
      this._y = tileY + updatedPos.y;
      this._angle = updatedPos.angle;

      this._tileTime += timeDeltaMs;
      this._internalTime += timeDeltaMs;
    }
  }
}

export {
  GridMovementPath,
  GridMovement
};
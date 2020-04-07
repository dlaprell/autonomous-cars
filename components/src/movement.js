import { rotate } from './utils';

class GridMovementPath {
  constructor(initialTile, initialFrom, directions) {
    this._initial = initialTile;
    this._initialFrom = initialFrom;
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

  nextDirections() {
    const to = this._directions[this._currentIndex + 1];
    return {
      from: rotate(this._current.to, 2),
      to
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

  speed() {
    return this._speed;
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
    return null;
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

      let neededTime = NaN;

      if (this._acceleration == 0) {
        // So there was no acceleration and we can use the basic speed and time
        // equotations
        neededTime = (deltaDistance / (1 / this._speed));
      } else {
        // This one is a bit more complex since we have to account for the acceleration
        // during the movement
        const o = Math.sqrt(Math.pow(baseSpeed, 2) + 2 * this._acceleration * deltaDistance);
        const res = [
          (-baseSpeed + o) / this._acceleration,
          (-baseSpeed - o) / this._acceleration
        ];

        neededTime = Math.min(...res.filter(x => x >= 0));

        this._speed += this._acceleration * (timeDeltaMs - neededTime);
        if (this._speed < 0) {
          this._speed = 0;
        }
      }

      this._internalTime += (timeDeltaMs - neededTime);

      if (neededTime * 0.95 > timeDeltaMs) {
        debugger;
      }

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
  constructor(grid, path) {
    super(grid);

    this._path = path;
  }

  getCurrentTileMovement() {
    return this._path.current();
  }

  getNextTileDirections() {
    return this._path.nextDirections();
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
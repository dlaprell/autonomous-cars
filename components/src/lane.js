class Lane {
  constructor() {
    this._adjacentTiles = new Set();
    this._includedTiles = new Set();
  }

  _absorbConnections(lane, tile) {
    for (const d of Object.values(tile._lanes)) {
      if (!d) {
        continue;
      }

      if (d.incoming === lane) {
        d.incoming = this;
      }

      if (d.outgoing === lane) {
        d.outgoing = this;
      }
    }
  }

  absorb(lane) {
    if (lane === this) {
      return;
    }

    for (const t of lane._adjacentTiles) {
      this._absorbConnections(lane, t);
      this._adjacentTiles.add(t);
    }

    for (const t of lane._includedTiles) {
      this._includedTiles.add(t);
      this._absorbConnections(lane, t);

      for (let i = 0; i < t._ownLanes.length; i++) {
        if (t._ownLanes[i] === lane) {
          t._ownLanes[i] = this;
        }
      }
    }

    lane._adjacentTiles = null;
    lane._includedTiles = null;
  }
}

export {
  Lane
};
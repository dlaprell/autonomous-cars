class Lane {
  constructor() {
    this._adjacentTiles = new Set();
    this._includedTiles = new Set();
  }

  absorb(lane) {
    for (const t of lane._adjacentTiles) {
      for (const d of Object.values(t._lanes)) {
        if (d.incoming === lane) {
          d.incoming = this;
        }

        if (d.outgoing === lane) {
          d.outgoing = this;
        }
      }

      this._adjacentTiles.add(t);
    }

    for (const t of lane._includedTiles) {
      this._includedTiles.add(t);

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
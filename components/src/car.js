import mitt from 'mitt';

class Car {
  constructor(movement) {
    this._movement = movement;

    this._emitter = mitt();
  }

  movement() {
    return this._movement;
  }

  onUpdate(listener) {
    this._emitter.on('update', listener);
  }

  setSpeed(s) {
    this._movement.setSpeed(s);
  }

  setAcceleration(a) {
    this._movement.setAcceleration(a);
  }

  update(timeDeltaMs) {
    this._movement.update(timeDeltaMs);

    const x = this._movement.getX();
    const y = this._movement.getY();
    const angle = this._movement.getAngle();

    this._emitter.emit('update', {
      target: this,
      
      timeDeltaMs: timeDeltaMs,

      x,
      y,
      angle
    });

    return { x, y, angle };
  }
}

export { Car };
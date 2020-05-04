// @ts-check
import mitt from 'mitt';

/**
 * @template T
 */
class TimeProvider {
  /**
   * @typedef {Object} TimeProviderEvent
   * @property {number} total
   * @property {number} delta
   * @property {T} context
   */

  /**
   * @param {T?} context 
   */
  constructor(context) {
    this._listeners = mitt();

    this._totalTime = 0;

    this._context = context;
    this._loop = false;
  }

  /**
   * @param {T} context
   */
  setContext(context) {
    this._context = context;
  }

  start() {
    this._loop = true;
  }

  stop() {
    this._loop = false;
  }

  looping() {
    return this._loop;
  }

  /**
   * @param {function(TimeProviderEvent) : void} listener
   */
  registerBeforeFrame(listener) {
    this._listeners.on('beforeFrame', listener);
  }

  /**
   * @param {function(TimeProviderEvent) : void} listener
   */
  registerOnFrame(listener) {
    this._listeners.on('frame', listener);
  }

  /**
   * @param {function(TimeProviderEvent) : void} listener
   */
  registerAfterFrame(listener) {
    this._listeners.on('afterFrame', listener);
  }

  /**
   * @param {Number} time
   */
  increment(time) {
    if (!this.looping()) {
      return;
    }

    this._totalTime += time;

    /** @type {TimeProviderEvent} */
    const event = {
      delta: time,
      total: this._totalTime,

      context: this._context
    };

    this._listeners.emit('beforeFrame', event);
    this._listeners.emit('frame', event);
    this._listeners.emit('afterFrame', event);
  }
}

class RafTimeProvider extends TimeProvider {
  constructor(context) {
    super(context);

    this._last = null;

    this._rafCallback = () => {
      if (!this.looping()) {
        this._last = null;
        return;
      }

      window.requestAnimationFrame(this._rafCallback);

      const now = new Date();
      const delta = this._last === null ? 0 : now.getTime() - this._last.getTime();
      this._last = now;

      this.increment(delta);
    };
   }

  start() {
    super.start();
    window.requestAnimationFrame(this._rafCallback);
  }
}

class WebXrProvider extends TimeProvider {
  constructor(context) {
    super(context);

    this._last = null;

    this._xrCallback = () => {
      if (!this.looping()) {
        this._last = null;
        return;
      }

      const now = new Date();
      const delta = this._last === null ? 0 : now.getTime() - this._last.getTime();
      this._last = now;

      this.increment(delta);
    };
  }

  getXrCallback() {
    return this._xrCallback;
  }
}

export {
  TimeProvider,

  RafTimeProvider,
  WebXrProvider
};
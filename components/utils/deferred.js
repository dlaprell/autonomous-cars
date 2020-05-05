// @ts-check

function requestIdleCallback(func, opt = {}) {
  // @ts-expect-error
  if (typeof window.requestIdleCallback !== 'undefined') {
    window.requestIdleCallback(func, opt);
  } else {
    setTimeout(func, 25);
  }
}

/**
 * @param {Generator} gen 
 * @param {number} [timeAmount] 
 */
export function deferredGenerator(gen, timeAmount = 10) {
  const asy = {
    _cancelled: false,

    _curFrameTs: null,

    _generator: gen,

    _ready: false,
    _result: undefined,

    result() {
      return this._result;
    },

    drain() {
      this._cancelled = true;

      if (this._ready) {
        return this._result;
      }

      for (;;) {
        const { value, done } = this._generator.next();
        if (done) {
          this._result = value;
          this._ready = true;
          return value;
        }
      }
    },

    defer() {
      requestIdleCallback(() => {
        if (this._cancelled) {
          return;
        }

        this._curFrameTs = null;
        this.next();
      }, { timeout: 1000 });
    },

    next() {
      for (;;) {
        const now = new Date().getTime();

        if (this._curFrameTs === null) {
          this._curFrameTs = now;
        } else {
          const delta = now - this._curFrameTs;

          if (delta >= timeAmount) {
            this.defer();
            return;
          }
        }

        const st = performance.now();

        const { done, value } = this._generator.next();

        const diff = performance.now() - st;
        if (diff > 300) {
          console.warn(`Generator step took ${diff} ms`);
        }

        if (done) {
          this._result = value;
          this._ready = true;
          return;
        }
      }
    },

    cancel() {
      this._cancelled = true;
    }
  };

  asy.defer();
  return asy;
}
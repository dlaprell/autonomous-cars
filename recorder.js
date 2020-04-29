// @ts-check
/** @jsx h */

import { h, render } from 'preact';
import { Simulation } from './components/Simulation';
import { TimeProvider } from './components/TimeProvider';
import world from './components/worlds/standard.json';

import tsWhammy from 'ts-whammy'

class RecorderProvider extends TimeProvider {
  constructor(...args) {
    super(...args);

    this._first = true;

    this.registerAfterFrame(({ context }) => {
      if (!this._first) {
        this.handleAfterFrame(context);
      }
      this._first = false;

      setTimeout(() => {
        this.renderNextFrame();
      }, 1);
    });

    this._frameRate = 60;

    this._time = 0;
    this._last = 0;

    this._frames = [];
    window._frames = this._frames;
  }

  start() {
    super.start();
    this.renderNextFrame();
  }

  renderNextFrame() {
    const delta = (1000 / this._frameRate);
    this._time += delta;

    const rounded = Math.round(this._time);
    const diff = rounded - this._last;
    this._last = rounded;

    this.increment(diff);
  }

  handleAfterFrame({ canvas }) {
    const url = canvas.toDataURL('image/webp', 0.95);
    this._frames.push(url);
  }

  stopRecording() {
    /** @type {Blob} */
    const blob = (/** @type {Blob} */ tsWhammy.fromImageArray(this._frames, 60));

    const objectURL = URL.createObjectURL(blob);
    window.open(objectURL);
  }
}

function init() {
  const root = document.body;

  const rec = new RecorderProvider(null);

  render(
    <Simulation
      container={root}
      withTraffic
      world={world}
      stopAfter={5000}
      onStop={() => rec.stopRecording()}
      timeProvider={rec}
    />,
    root
  );
}

window.addEventListener('load', (/* event */) => {
  init();
});

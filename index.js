/** @jsx h */

import { h, render } from 'preact';
import { Simulation } from './components/Simulation';
import world from './components/worlds/standard.json';

function init() {
  const root = document.body;

  render(
    <Simulation
      container={root}
      withCamera={window.location.href.indexOf('camera') !== -1}
      withTraffic
      world={world}
      vr={window.location.href.indexOf('vr') !== -1}
      stopAfter={30000}
      onStop={() => alert('Stopped')}
    />,
    root
  );
}

window.addEventListener('load', (/* event */) => {
  init();
});

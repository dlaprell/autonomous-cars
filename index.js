/** @jsx h */

import { h, render } from 'preact';
import { Simulation } from './components/Simulation';
import world from './components/worlds/standard.json';

function init() {
  const root = document.body;

  render(
    <Simulation
      withCamera={true}
      withTraffic
      world={world}
      baseMap={world.map}
      vr={window.location.href.indexOf('vr') !== -1}
    />,
    root
  );
}

window.addEventListener('load', (/* event */) => {
  init();
});

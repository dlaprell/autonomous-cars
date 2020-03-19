/** @jsx h */

import { h, render } from 'preact';
import { Simulation } from './components/Simulation';

function init() {
  const root = document.body;

  render(
    <Simulation />,
    root
  );
}

window.addEventListener('load', (/* event */) => {
  init();
});

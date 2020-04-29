/** @jsx h */

// Must be the first import
import "preact/debug";

import { h, render } from 'preact';
import { Survey } from './Survey';

function init() {
  const root = document.body;

  render(
    <Survey />,
    root
  );
}

window.addEventListener('load', (/* event */) => {
  init();
});

/** @jsx h */

// Must be the first import
import "preact/debug";

import Router from 'preact-router';
import { h, render, Fragment } from 'preact';

import Home from './HomePage';
import Creator from './CreatorPage';
import Recorder from './RecorderPage';

const isProd = process.env.NODE_ENV === 'production';

function Main({ root }) {
  return (
    <Fragment>
      <Router>
        <Home path="/" root={root} />

        {!isProd && <Creator path="/creator" root={root} />}
        {!isProd && <Recorder path="/recorder" root={root} />}
      </Router>
      <style jsx global>{`
        body {
          width: 100vw;
          height: 100vh;
          margin: 0;
          overflow: hidden;
        }
      `}</style>
    </Fragment>
  );
}

function init() {
  const root = document.body;
  render(<Main root={root} />, root);
}

window.addEventListener('load', (/* event */) => {
  init();
});

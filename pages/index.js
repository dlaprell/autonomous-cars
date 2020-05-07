/** @jsx h */

// Must be the first import
import "preact/debug";

import 'unfetch/polyfill';

import Router from 'preact-router';
import { h, render, Fragment } from 'preact';

import Home from './HomePage';
import Creator from './CreatorPage';
import Recorder from './RecorderPage';
import SurveyPage from './SurveyPage';
import NotFound from './NotFoundPage';

import TestPage from './TestPage';

const isProd = process.env.NODE_ENV === 'production';

function Main({ root }) {
  return (
    <Fragment>
      <Router>
        {!isProd && <Home path="/" root={root} />}

        {!isProd && <Creator path="/creator" root={root} />}
        {!isProd && <Recorder path="/recorder" root={root} />}
        <SurveyPage path="/survey" root={root} />
        {!isProd && <TestPage path="/test" root={root} />}

        <NotFound default />
      </Router>
      <style jsx global>{`
        html {
          height: 100%;
          box-sizing: border-box;
        }

        *,
        ul, li,
        *:before,
        *:after {
          box-sizing: inherit;
          margin: 0;
          padding: 0;
          font-weight: 200;
        }

        a {
          -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
        }

        body {
          position: relative;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
          text-rendering: optimizeLegibility;
          font-size: 16px;

          height: 100%;
          height: 100vh;
          margin: 0;
          overflow: hidden;
        }
        html, body {
          background-color: #fff;
          color: #000;
        }

        h1, h2, h3, h4, h5, h6 {
          font-weight: 300;
          padding-top: 5px;
          padding-bottom: 5px;
        }
        h1 { font-size: 28px; }
        h2 { font-size: 26px; }
        h3 { font-size: 24px; }
        h4 { font-size: 22px; }
        h5 { font-size: 20px; }
        h6 { font-size: 18px; }
        p {
          margin-bottom: 10px;
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

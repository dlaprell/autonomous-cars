/** @jsx h */

import { h } from 'preact';
import { Simulation } from '../components/Simulation';
import world from '../components/worlds/standard.json';

export default function Home({ root }) {
  return (
    <Simulation
      container={root}
      withCamera={window.location.href.indexOf('camera') !== -1}
      withTraffic
      world={world}
      vr={window.location.href.indexOf('vr') !== -1}
      renderOptions={{
        antialias: window.location.href.indexOf('antialias') !== -1,
        shadow: window.location.href.indexOf('shadow') !== -1
      }}
      stopAfter={25000}
    />
  );
}
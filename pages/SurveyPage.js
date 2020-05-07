// @ts-check

/** @jsx h */

import { h, Component } from 'preact';
import { extractWorldsForRuns } from '../components/worlds/WorldSelector';

import { Content, SimulationWrapper, ProgressBar } from './survey/Ui';
import AspectRatioKeeper from './survey/AspectRatioKeeper';
import { assert } from '../components/utils/assert';
import { Simulation } from '../components/Simulation';
import loadModels from '../components/models/ModelLoader';
import { GridMap } from '../components/src/grid';

import Intro from './survey/IntroPage';
import RunResult from './survey/RunResult';

const languages = {
  de: {},
  en: {}
};

const RUN_TIME = process.env.NODE_ENV !== 'production'
  ? Number(new URLSearchParams(window.location.search).get('run_time') || '20000')
  : 20000;

const NUM_RUNS = process.env.NODE_ENV !== 'production'
  ? Number(new URLSearchParams(window.location.search).get('run_count') || 'Infinity')
  : Infinity;

/**
 * @returns {Array<string>}
 */
function getUserLanguages() {
  return Array.from(
    navigator.languages ||
    (navigator.language ? [ navigator.language ] : null) ||
    // @ts-expect-error <- ts does not know about these properties
    (navigator.userLanguage ? [ navigator.userLanguage ] : null) ||
    [ 'en' ]
  );
}

function preLoadNextRun({ curRun, runs, models }) {
  if (curRun !== null && curRun >= runs.length - 1) {
    return { preLoadGrid: null, preLoadedRun: null };
  }

  const preLoadedRun = curRun === null ? 0 : curRun + 1;

  const r = runs[preLoadedRun];

  const preLoadGrid = new GridMap(
    models,
    {
      baseMap: r.world.map,
      creatorView: false,
      asyncInit: true
    }
  );

  return { preLoadGrid, preLoadedRun };
}

export default class SurveyPage extends Component {
  constructor(...args) {
    super(...args);

    // So we want to get the language, that we support and that
    // the user prefers
    const languageData = getUserLanguages()
      .map(lang => {
        if (lang.indexOf('-') !== -1) {
          // We currently do not support local dialects
          lang = lang.split('-')[0];
        }

        return languages[lang];
      })
      .find(Boolean) || null;

    let runs = extractWorldsForRuns();
    if (runs.length > NUM_RUNS) {
      runs = runs.slice(0, NUM_RUNS);
    }

    console.info('All runs: ', runs);

    /** @type {Array<boolean | null>} */
    const runResults = new Array(runs.length).fill(null);

    this._forestCache = null;

    this.state = {
      languageData,

      intro: true,

      models: null,
      modelsLoaded: false,
      modelsError: null,

      preLoadedRun: null,
      preLoadGrid: null,

      runs,
      curRun: null,
      curRunFinished: false,
      runResults
    };

    this.skipIntro = () => {
      this.setState(st => {
        let { preLoadGrid, preLoadedRun, models, runs } = st;

        if (preLoadedRun !== null) {
          assert(preLoadedRun === 0);
          preLoadGrid.ensureReady();
        } else {
          preLoadedRun = 0;
          preLoadGrid = new GridMap(models, {
            creatorView: false,
            baseMap: runs[0].world.map,
            asyncInit: false
          });
        }

        console.info('starting run: ', runs[0]);

        return {
          intro: false,
          curRun: 0,
          preLoadGrid,
          preLoadedRun: 0
        };
      });
    };

    this.handleSimulationStop = () => {
      this.setState(({ curRun, runs, models }) => {
        const up = preLoadNextRun({ curRun, runs, models });

        return {
          ...up,
          curRunFinished: true
        };
      });
    };

    this.moveToNextRun = (result) => {
      this.setState(({ curRun, runResults, preLoadGrid, preLoadedRun }) => {

        const updatedResults = [ ...runResults ];
        updatedResults[curRun] = result;

        if (preLoadGrid !== null) {
          assert(preLoadedRun === curRun + 1);
          preLoadGrid.ensureReady();
        }

        console.info('starting run: ', runs[curRun + 1]);

        return {
          curRun: curRun + 1,
          curRunFinished: false,
          runResults: updatedResults
        };
      });
    }
  }

  componentDidMount() {
    loadModels({
      onError: (err) => {
        this.setState({
          modelsError: err,
          modelsLoaded: true
        });
      },

      onProgress: () => {},

      onLoad: (models) => {
        this._forestCache = null;

        let preL = {};
        if (this.state.intro) {
          preL = preLoadNextRun({
            curRun: this.state.curRun,
            runs: this.state.runs,
            models
          });
        }

        this.setState({
          ...preL,

          models,
          modelsLoaded: true
        });
      }
    });
  }

  render() {
    const {
      intro,

      curRun,
      runs,
      curRunFinished,
      runResults,

      preLoadGrid,
      preLoadedRun,

      models,
      modelsError,
      modelsLoaded
    } = this.state;

    const inRuns = curRun !== null && curRun < runs.length;

    const total = runs.length + 2;
    const progress = (
      <ProgressBar total={total} now={
        intro ? 0 : (
          inRuns ? 1 + curRun : curRun.length
        )
      } />
    );

    if (intro) {
      return (
        <Intro
          onStart={this.skipIntro}
          footer={progress}
        />
      );
    }

    if (inRuns) {
      assert(curRun >= 0 && curRun < runs.length);

      if (!modelsLoaded) {
        return (
          <Content footer={progress}>
            Loading models
          </Content>
        );
      }

      if (modelsError !== null) {
        return (
          <Content footer={progress}>
            <h3>An Error occured</h3>

            <pre>{modelsError.stack}</pre>
          </Content>
        );
      }

      if (this._forestCache !== null) {
        this._forestCache.cancel();
        this._forestCache = null;
      }

      const { world } = runs[curRun];

      if (!curRunFinished) {
        assert(preLoadGrid);
        assert(preLoadedRun === curRun);

        return (
          <SimulationWrapper>
            <AspectRatioKeeper minRatio={4 / 3} maxRatio={16 / 9}>
              <Simulation
                withTraffic
                world={world}
                preLoadedGrid={preLoadGrid}
                stopAfter={RUN_TIME}
                models={models}
                onStop={this.handleSimulationStop}
              />
            </AspectRatioKeeper>
          </SimulationWrapper>
        );
      } else {
        return (
          <RunResult onResult={this.moveToNextRun} footer={progress} />
        );
      }
    }

    if (curRun !== null && curRun >= runs.length) {
      return (
        <Content footer={progress}>
          Submit results here ...

          <pre>
            {JSON.stringify(
              runs.map(
                (r, idx) => ({ name: r.name, answer: runResults[idx] })
              ), null, 2
            )}
          </pre>
        </Content>
      );
    }

    assert(false, 'Should never be reached');
  }
}
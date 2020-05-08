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
import Tutorial from './survey/TutorialPage';
import ResultSubmit from './survey/ResultSubmitPage';

const languages = {
  de: {},
  en: {}
};

const RUN_TIME = process.env.NODE_ENV !== 'production'
  ? Number(new URLSearchParams(window.location.search).get('run_time') || '20000')
  : 20000;

const NUM_MAX_RUNS = process.env.NODE_ENV !== 'production'
  ? Number(new URLSearchParams(window.location.search).get('run_count') || 'Infinity')
  : 3;

function debug(...args) {
  if (process.env.NODE_ENV !== 'production') {
    console.debug(...args);
  }
}
/** @enum {string} */
const UI_STATE = {
  INTRO: 'intro',
  TUTORIAL: 'tutorial',
  RUNS: 'runs',
  FINISHED: 'finshed'
}

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
    if (runs.length > NUM_MAX_RUNS) {
      runs = runs.slice(0, NUM_MAX_RUNS);
    }

    console.info('All runs: ', runs);

    /** @type {Array<boolean | null>} */
    const runResults = new Array(runs.length).fill(null);

    this.state = {
      languageData,

      driverLicense: null,
      age: null,

      /** @type {UI_STATE} */
      uiState: UI_STATE.INTRO,

      models: null,
      modelsLoading: true,
      modelsError: null,

      preLoadedRun: null,
      preLoadGrid: null,

      runs,
      curRun: null,
      curRunFinished: false,
      runResults
    };

    this.skipIntro = ({ driverLicense, age }) => {
      this.setState({
        uiState: UI_STATE.TUTORIAL,
        driverLicense,
        age
      });
    };

    this.handleSimulationStop = () => {
      this.setState(({ curRun, runs, models }) => {

        let preLoadGrid = null;
        let preLoadedRun = null;

        if (curRun + 1 < runs.length) {
          const { world } = runs[curRun + 1];

          preLoadedRun = curRun + 1;
          preLoadGrid = new GridMap(models, {
            baseMap: world.map,
            creatorView: false,
            asyncInit: true
          });

          debug(`Started preloading for run=${preLoadedRun}`);
        }

        return {
          preLoadGrid,
          preLoadedRun,
          curRunFinished: true
        };
      });
    };

    this.moveToNextRun = (result) => {
      this.setState(({ curRun, runResults, models, preLoadGrid, preLoadedRun }) => {
        let updatedResults;
        let nextRun;
        let finished = false;
        let uiState;

        debug(`Requested next run, cur=${curRun}, preLoaded=${preLoadedRun}`);

        if (curRun === null) {
          updatedResults = runResults;
          nextRun = 0;
          uiState = UI_STATE.RUNS;
        } else {
          updatedResults = [ ...runResults ];
          updatedResults[curRun] = result;

          if (curRun + 1 < runs.length) {
            nextRun = curRun + 1;
            uiState = UI_STATE.RUNS;
          } else {
            nextRun = null;
            uiState = UI_STATE.FINISHED;
          }
        }

        let grid = preLoadGrid;
        let loaded = null;

        if (grid) {
          assert(preLoadedRun === nextRun);
          loaded = nextRun;
          grid.ensureReady();
        } else {
          assert(!models || uiState === UI_STATE.FINISHED);
        }

        if (!finished) {
          console.info('starting run: ', nextRun, runs[nextRun]);
        }

        return {
          uiState,
          curRun: nextRun,

          preLoadedRun: loaded,
          preLoadGrid: grid,

          curRunFinished: false,
          runResults: updatedResults
        };
      });
    }
  }

  componentDidMount() {
    loadModels({
      onError: (err) => {
        console.error(err);
        this.setState({
          modelsError: err,
          modelsLoading: false
        });
      },

      onProgress: () => {},

      onLoad: (models) => {
        this.setState(st => {
          const { world } = st.runs[0];

          debug(`Models finished loading`);
          assert(st.preLoadGrid === null);
          assert(st.preLoadedRun === null);

          const grid = new GridMap(models, {
            asyncInit: st.curRun === null,
            creatorView: false,
            baseMap: world.map
          });

          return {
            preLoadGrid: grid,
            preLoadedRun: 0,

            models,
            modelsLoading: false
          };
        });
      }
    });
  }

  render() {
    const {
      uiState,

      driverLicense,
      age,

      curRun,
      runs,
      curRunFinished,
      runResults,

      preLoadGrid,
      preLoadedRun,

      models,
      modelsError,
      modelsLoading
    } = this.state;

    assert(Object.values(UI_STATE).indexOf(uiState) !== -1);

    const total = runs.length + 2;
    const progress = (
      <ProgressBar total={total} now={
        uiState === UI_STATE.INTRO ? 0 : (
          uiState === UI_STATE.TUTORIAL ? 1 : (
            uiState === UI_STATE.RUNS
              ? 2 + curRun
              : runs.length + 2
          )
        )
      } />
    );

    if (uiState === UI_STATE.INTRO) {
      return (
        <Intro
          onStart={this.skipIntro}
          footer={progress}
        />
      );
    }

    if (uiState === UI_STATE.TUTORIAL) {
      return (
        <Tutorial
          onStart={this.moveToNextRun}
          footer={progress}
        />
      );
    }

    if (uiState === UI_STATE.RUNS) {
      assert(curRun >= 0 && curRun < runs.length);

      if (modelsLoading) {
        return (
          <Content footer={progress}>
            Loading models
          </Content>
        );
      }

      if (modelsError) {
        return (
          <Content footer={progress}>
            <h3>An Error occured</h3>

            <pre>{modelsError.stack}</pre>
          </Content>
        );
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

    if (uiState === UI_STATE.FINISHED) {
      return (
        <ResultSubmit
          resultData={{
            age,
            driverLicense,
            results: runs.map(
              (r, idx) => ({ name: r.name, answer: runResults[idx] })
            )
          }}
          footer={progress}
        />
      );
    }

    assert(false, 'Should never be reached');
  }
}
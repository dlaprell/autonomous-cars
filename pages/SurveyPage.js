// @ts-check

/** @jsx h */

import { h, Component } from 'preact';
import { WEBGL } from 'three/examples/jsm/WebGL';

import { extractWorldsForRuns } from '../components/worlds/WorldSelector';

import { Content, SimulationWrapper, ProgressBar } from './survey/Ui';
import AspectRatioKeeper from './survey/AspectRatioKeeper';
import { assert } from '../components/utils/assert';
import { Simulation } from '../components/Simulation';
import loadModels from '../components/models/ModelLoader';
import { GridMap } from '../components/src/grid';

import Intro from './survey/IntroPage';
import Data from './survey/DataPage';
import Hint from './survey/HintsPage';
import Tutorial from './survey/TutorialPage';
import RunResult from './survey/RunResult';
import ResultSubmit from './survey/ResultSubmitPage';
import AttentionTest from './survey/AttentionTestPage';

const languages = {
  de: {},
  en: {}
};

const RUN_TIME = process.env.NODE_ENV !== 'production'
  ? Number(new URLSearchParams(window.location.search).get('run_time') || '20000')
  : 20000;

const NUM_MAX_RUNS = process.env.NODE_ENV !== 'production'
  ? Number(new URLSearchParams(window.location.search).get('run_count') || 'Infinity')
  : Infinity;

const ATTENTION_TESTS_EACH = process.env.NODE_ENV !== 'production'
  ? Number(new URLSearchParams(window.location.search).get('attn_test') || '20')
  : 20;

function debug(...args) {
  if (process.env.NODE_ENV !== 'production') {
    console.debug(...args);
  }
}
/** @enum {string} */
const UI_STATE = {
  INTRO: 'intro',
  HINT: 'hint',
  DATA: 'data',
  TUTORIAL: 'tutorial',
  RUNS: 'runs',
  FINISHED: 'finshed',
  ATTENTION: 'attention'
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

function storageAvailable(type) {
  let storage;
  try {
      /** @type {WindowLocalStorage|WindowSessionStorage} */
      storage = window[type];
      let x = '__storage_test__';

      // @ts-ignore
      storage.setItem(x, x);

      // @ts-ignore
      storage.removeItem(x);
      return true;
  } catch(e) {
      return e instanceof DOMException && (
          // everything except Firefox
          e.code === 22 ||
          // Firefox
          e.code === 1014 ||
          // test name field too, because code might not be present
          // everything except Firefox
          e.name === 'QuotaExceededError' ||
          // Firefox
          e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
          // acknowledge QuotaExceededError only if there's something already stored
          (storage && storage.length !== 0);
  }
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

    const runsWithAttnTests = [];
    const offsetInitial = Math.floor(ATTENTION_TESTS_EACH / 2 + (ATTENTION_TESTS_EACH / 2) * Math.random());
    for (let i = offsetInitial; i < runs.length; i += ATTENTION_TESTS_EACH) {
      runsWithAttnTests.push(i);
    }

    debug("Attention tests at runs: ", runsWithAttnTests);

    this.webGlSupport = WEBGL.isWebGLAvailable();
    if (!this.webGlSupport) {
      this.webGlError = WEBGL.getWebGLErrorMessage();
    }

    const group = Math.random() <= 0.5 ? 'a' : 'b';

    console.info('All runs: ', runs);

    /** @type {Array<boolean | null>} */
    const runResults = new Array(runs.length).fill(null);

    this.state = {
      languageData,

      driverLicense: null,
      age: null,
      gender: null,

      /** @type {UI_STATE} */
      uiState: UI_STATE.INTRO,

      models: null,
      modelsLoading: true,
      modelsError: null,

      preLoadedRun: null,
      preLoadGrid: null,

      group,
      runs,
      curRun: null,
      curRunFinished: false,
      runResults
    };

    this.handleAttentionTestFinished = () => {
      this.setState({
        uiState: UI_STATE.RUNS
      });
    };

    this.handleNext = (data) => {
      this.setState(({ uiState }) => {
        assert(
          uiState === UI_STATE.INTRO || uiState === UI_STATE.HINT ||
          uiState === UI_STATE.DATA || uiState === UI_STATE.TUTORIAL
        );

        const update = {};

        switch (uiState) {
          case UI_STATE.INTRO: {
            update.uiState = UI_STATE.DATA;
            break;
          }

          case UI_STATE.DATA: {
            update.uiState = UI_STATE.HINT;

            const { driverLicense, age, gender } = data;
            update.driverLicense = driverLicense;
            update.age = age;
            update.gender = gender;
            break;
          }

          case UI_STATE.HINT: {
            update.uiState = UI_STATE.TUTORIAL;
            break;
          }

          case UI_STATE.TUTORIAL: {
            update.uiState = UI_STATE.RUNS;
            break;
          }
        }

        assert(typeof update.uiState === 'string' && update.uiState !== uiState);

        return update;
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

        const attentionTest = runsWithAttnTests.indexOf(curRun) !== -1;

        return {
          preLoadGrid,
          preLoadedRun,
          curRunFinished: true,

          uiState: attentionTest ? UI_STATE.ATTENTION : UI_STATE.RUNS
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
    if (!this.webGlSupport) {
      return (
        <Content footer={null}>
          <h3>Entschuldingung</h3>

          <p>
            Teile dieser Studie basieren auf einer Technik mit dem Namen WebGL.
            Ihr aktueller Browser scheint diese Technik nicht zu unterstützen. Daher
            können Sie zur Zeit leider nicht an der Studie teilnehmen.
          </p>

          <div dangerouslySetInnerHTML={{ __html: this.webGlError.outerHTML }} />
        </Content>
      );
    }

    const {
      uiState,

      driverLicense,
      age,
      gender,

      group,

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


    const progTotal = runs.length + 4;
    let progValue = 0;
    switch (uiState) {
      case UI_STATE.INTRO: {
        progValue = 0;
        break;
      }
      case UI_STATE.DATA: {
        progValue = 1;
        break;
      }
      case UI_STATE.HINT: {
        progValue = 2;
        break;
      }
      case UI_STATE.TUTORIAL: {
        progValue = 3;
        break;
      }
      case UI_STATE.RUNS:
      case UI_STATE.ATTENTION: {
        progValue = 4 + curRun;
        break;
      }
      case UI_STATE.FINISHED: {
        progValue = 4 + runs.length;
        break;
      }
    }

    const progress = (
      <ProgressBar total={progTotal} now={progValue} />
    );

    if (uiState === UI_STATE.INTRO) {
      return (
        <Intro
          onNext={this.handleNext}
          footer={progress}
        />
      );
    }

    if (uiState === UI_STATE.DATA) {
      return (
        <Data
          onNext={this.handleNext}
          footer={progress}
        />
      );
    }

    if (uiState === UI_STATE.HINT) {
      return (
        <Hint
          group={group}
          onNext={this.handleNext}
          footer={progress}
        />
      );
    }

    if (uiState === UI_STATE.TUTORIAL || uiState === UI_STATE.RUNS) {
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
    }

    if (uiState === UI_STATE.TUTORIAL) {
      return (
        <Tutorial
          duration={RUN_TIME}
          models={models}
          onReady={this.moveToNextRun}
          footer={progress}
        />
      );
    }

    if (uiState === UI_STATE.ATTENTION) {
      return (
        <AttentionTest
          footer={progress}
          onNext={this.handleAttentionTestFinished}
        />
      );
    }

    if (uiState === UI_STATE.RUNS) {
      assert(curRun >= 0 && curRun < runs.length);
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
            group,
            gender,
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
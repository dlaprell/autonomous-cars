// @ts-check

/** @jsx h */

import { h, Component } from 'preact';
import { extractWorldsForRuns } from '../components/worlds/WorldSelector';

import { Content } from './survey/Ui';
import { assert } from '../components/utils/assert';
import { Simulation } from '../components/Simulation';
import RunResult from './survey/RunResult';
import loadModels from '../components/models/ModelLoader';
import { GridMap } from '../components/src/grid';

const languages = {
  de: {},
  en: {}
};

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

    const runs = extractWorldsForRuns();

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

    if (intro) {
      return (
        <Content onNextClick={this.skipIntro} nextDisabled={false}>
          Intro text here ...
        </Content>
      );
    }

    if (curRun !== null && curRun < runs.length) {
      assert(curRun >= 0 && curRun < runs.length);

      if (!modelsLoaded) {
        return (
          <Content nextDisabled={true} onNextClick={null}>
            Loading models
          </Content>
        );
      }

      if (modelsError !== null) {
        return (
          <Content nextDisabled={true} onNextClick={null}>
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
          <Simulation
            withTraffic
            world={world}
            preLoadedGrid={preLoadGrid}
            stopAfter={40000}
            models={models}
            onStop={this.handleSimulationStop}
          />
        );
      } else {
        return (
          <RunResult onResult={this.moveToNextRun} />
        );
      }
    }

    if (curRun !== null && curRun >= runs.length) {
      return (
        <Content onNextClick={null} nextDisabled={true}>
          Submit results here ...

          <pre>
            {JSON.stringify(runs.map((r, idx) => ({ name: r.name, config: r.config, answer: runResults[idx] })), null, 2)}
          </pre>
        </Content>
      );
    }

    assert(false, 'Should never be reached');
  }
}
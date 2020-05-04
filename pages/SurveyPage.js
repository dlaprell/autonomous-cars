// @ts-check

/** @jsx h */

import { h, Component, Fragment } from 'preact';
import { extractWorldsForRuns } from '../components/worlds/WorldSelector';

import { Content } from './survey/Ui';
import { assert } from '../components/utils/assert';
import { Simulation } from '../components/Simulation';
import RunResult from './survey/RunResult';
import loadModels from '../components/models/ModelLoader';

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

    this.state = {
      languageData,

      intro: true,

      models: null,
      modelsLoaded: false,
      modelsError: null,

      runs,
      curRun: null,
      curRunFinished: false,
      runResults
    };

    this.skipIntro = () => {
      this.setState({ intro: false, curRun: 0 });
    };

    this.handleSimulationStop = () => {
      this.setState({ curRunFinished: true });
    };

    this.moveToNextRun = (result) => {
      const { curRun, runResults } = this.state;

      // TODO: collect results and update
      const updatedResults = [ ...runResults ];
      updatedResults[curRun] = result;

      this.setState({
        curRun: curRun + 1,
        curRunFinished: false,
        runResults: updatedResults
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
        this.setState({
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

      const { world } = runs[curRun];

      if (!curRunFinished) {
        return (
          <Simulation
            withTraffic
            world={world}
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
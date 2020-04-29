/** @jsx h */

import { h, Component, createRef } from 'preact';

import { Simulation } from '../components/Simulation';
import defaultWorld from '../components/worlds/standard.json';

const languages = {
  de: null,
  en: null
};

function getUserLanguages() {
  return (
    navigator.languages ||
    (navigator.language ? [ navigator.language ] : null) ||
    (navigator.userLanguage ? [ navigator.userLanguage ] : null) ||
    [ 'en' ]
  );
}

function DefaultContent({ children }) {
  return (
    <div className="content">
      {children}

      <style jsx>{`
        .content {
          height: 100%;
          overflow: auto;
          overflow-x: hidden;
          overflow-y: auto;

          max-width: 768px;
          margin: 0 auto;
        }
      `}</style>
    </div>
  );
}

class Survey extends Component {
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

    this.state = {
      run: 0,
      languageData
    };

    this._mainRef = createRef(null);

    this.handleNextClick = () => {
      this.setState(st => ({ ...st, run: st.run + 1 }));
    }

    this.handleStop = () => {
      this.setState(st => ({ ...st, run: st.run + 1 }));
    }
  }

  render() {
    const { languageData, run } = this.state;

    return (
      <div className="layout">
        <main ref={this._mainRef}>
          {(run % 2) === 0 && (
            <DefaultContent>
              Hello
            </DefaultContent>
          )}

          {(run % 2) === 1 && (
            <Simulation
              container={this._mainRef.current}
              withTraffic
              world={defaultWorld}
              stopAfter={30000}
              onStop={this.handleStop}
            />
          )}
        </main>

        <footer>
          <button type="button" onClick={this.handleNextClick} disabled={(run % 2) === 1}>
            Next
          </button>
        </footer>

        <style jsx>{`
          div.layout {
            width: 100%;
            height: 100%;

            display: flex;
            flex-direction: column;
          }

          main {
            flex: 1;

            overflow: auto;
            overflow-x: hidden;
            overflow-y: auto;
          }

          footer {
            flex: 0 0 auto;
            min-height: 32px;
          }
        `}</style>
      </div>
    );
  }
}

export { Survey };
// @ts-check

/** @jsx h */

import { h, Component, Fragment } from 'preact';
import { Content, Button, ButtonBar } from './Ui';
import { version } from '../../package.json';

/** @enum {string} */
const UI_STATE = {
  START: 'start',
  LOADING: 'loading',
  ERROR: 'error',
  FINISHED: 'finished'
};

export default class TutorialPage extends Component {
  constructor(...args) {
    super(...args);

    this.state = {
      error: null,
      uiState: UI_STATE.START
    };

    this.submitResults = () => {
      this.setState({
        uiState: UI_STATE.LOADING
      });

      const { resultData } = this.props;

      fetch(
        '/results',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Request-With': `survey-${version}`
          },
          body: JSON.stringify({
            mobile: false,
            ...resultData
          })
        }
      )
        .then(r => {
          if (r.ok) {
            this.setState({
              uiState: UI_STATE.FINISHED
            });
            return;
          }

          this.setState({
            uiState: UI_STATE.ERROR,
            error: `Error: request return with status code ${r.status}`
          });
        })
        .catch(ex => {
          this.setState({
            uiState: UI_STATE.ERROR,
            error: ex
          });
        })
    };
  }

  render() {
    const { footer } = this.props;
    const { uiState, error } = this.state;

    return (
      <Content footer={footer}>
        <div className="root">
          <div className="top-spacer" />

          <h3>
            {uiState === UI_STATE.FINISHED ? (
              "Thanks for participating"
            ) : (
              "Results submission"
            )}
          </h3>

          {uiState === UI_STATE.ERROR && (
            <p>
              An error occured:
              <pre>
                {error}
              </pre>
            </p>
          )}

          {uiState === UI_STATE.FINISHED && (
            <p>
              Some thank you note...
            </p>
          )}

          {uiState === UI_STATE.START && (
            <p>
              Finished text...
            </p>
          )}

          {uiState !== UI_STATE.FINISHED && (
            <Fragment>
              <div className="top-spacer" />

              <ButtonBar align="center">
                <Button onClick={this.submitResults} disabled={uiState === UI_STATE.LOADING}>
                  {uiState === UI_STATE.ERROR ? 'Retry submission' : 'Submit Results'}
                </Button>
              </ButtonBar>
            </Fragment>
          )}
        </div>

        <style jsx>{`
          div.root {
            display: flex;
            flex-direction: column;
            min-height: 100%;
            padding: 8px;
          }

          .top-spacer {
            flex: 1;
            max-height: 64px;
          }
        `}</style>
      </Content>
    );
  }
}
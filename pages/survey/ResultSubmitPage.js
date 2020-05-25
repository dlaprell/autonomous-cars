// @ts-check

/** @jsx h */

import { h, Component, Fragment } from 'preact';
import { Content, Button, ButtonBar, Textbox } from './Ui';
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

      email: null,

      uiState: UI_STATE.START
    };

    this.handleEmailChange = (evt) => {
      const { value } = evt.target;

      this.setState({
        email: value.length === 0 ? null : value
      });
    };

    this.submitResults = () => {
      this.setState({
        uiState: UI_STATE.LOADING
      });

      const { email } = this.state;
      const { resultData } = this.props;

      /** @type {HTMLMetaElement?} */
      const node = document.querySelector('meta[name="x-survey-data-endpoint"]');
      const endpoint = node ? node.content : '/results';

      fetch(
        endpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Request-With': `survey-${version}`
          },
          body: JSON.stringify({
            email,

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
    const { uiState, error, email } = this.state;

    return (
      <Content footer={footer}>
        <div className="root">
          <div className="top-spacer" />

          <h3>
            {uiState === UI_STATE.FINISHED ? (
              "Vielen Dank"
            ) : (
              "Ende"
            )}
          </h3>

          <p>
            Vielen Dank für Ihre Teilnahme an der Studie. Unser Ziel ist es, herauszufinden,
            ob autonome Autos im Straßenverkehr Aufmerksamkeit auf sich ziehen und andere
            Verkehrsteilnehmer ablenken könnten. Da gerade im Straßenverkehr schon geringe
            Ablenkungen negative Konsequenzen mit sich bringen können, ist es wichtig,
            herauszufinden, was solche Ablenkungen auslösen kann. Autonome Autos könnten
            schon in naher Zukunft ein fester Bestandteil des Verkehrsgeschehens sein, aber
            bisher ist nur wenig Forschung zum Einfluss auf andere Verkehrsteilnehmer
            betrieben worden. Aus diesem Grund wollten wir die Untersuchung dieser Frage
            mit dieser Studie anstoßen.
          </p>

          {uiState === UI_STATE.START && (
            <div>
              <p>
                Wenn Sie Psychologie an der Heinrich-Heine-Universität Düsseldorf studieren, können
                Sie hier Ihre E-Mail-Adresse angeben, um zwei halbe VP-Stunden zu erhalten. Die
                E-Mail-Adresse wird separat von Ihren Daten gespeichert.
              </p>

              <Textbox
                type="email"
                name="email"
                label="E-Mail Adresse"
                value={email}
                error={Boolean(email) && email.indexOf('@') === -1}
                onInput={this.handleEmailChange}
              />
            </div>
          )}

          <p>
            Wenn Sie am Ergebnis interessiert sind, kontaktieren Sie gerne{' '}
            <a href="mailto:Julie.Niziurski@hhu.de">Julie Niziurski (Julie.Niziurski@hhu.de)</a>
            {' '}für weitere Informationen.
          </p>

          {uiState === UI_STATE.FINISHED && (
            <h5>
              Sie können das Browserfenster jetzt schließen
            </h5>
          )}

          {uiState === UI_STATE.ERROR && (
            <p>
              An error occured:
              <pre>
                {error}
              </pre>
            </p>
          )}

          {uiState !== UI_STATE.FINISHED && (
            <Fragment>
              <div className="top-spacer" />

              <ButtonBar align="center">
                <Button onClick={this.submitResults} disabled={uiState === UI_STATE.LOADING}>
                  {uiState === UI_STATE.ERROR ? 'Erneut versuchen' : 'Daten Abschicken'}
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
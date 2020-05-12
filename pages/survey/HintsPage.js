// @ts-check

/** @jsx h */

import { h, Component, Fragment } from 'preact';
import { Content, Button, ButtonBar } from './Ui';

import { assert } from '../../components/utils/assert';

// @ts-expect-error
import exampleImageUrl from '../../static/images/targets-example.jpg';

export default class IntroPage extends Component {
  constructor(...args) {
    super(...args);

    this.state = {
      agreed: false
    };

    this.handleNext = (evt) => {
      evt.preventDefault();

      const { onNext } = this.props;
      if (onNext) {
        onNext();
      }
    }
  }

  render() {
    const { footer, group } = this.props;
    assert(group === 'a' || group === 'b')

    return (
      <Content footer={footer}>
        <div className="top-spacer" />

        <h1>
          Hinweise zur Study
        </h1>

        {group === 'a' && (
          <Fragment>
            <p>
              In der Studie geht es darum, Ihre Aufmerksamkeit im Straßenverkehr zu testen
              und Faktoren, die diese beeinflussen könnte zu analysieren. Dazu werden Sie
              einige kurze Video-Sequenzen einer Straßenszene sehen und im Anschluss eine
              Frage beantworten. Es ist uns wichtig, dass Sie sich ganz auf den Verkehr und
              Ihre Aufgabe konzentrieren, wenn Sie die Videos anschauen. Ab und zu wird es
              einen kleinen Aufmerksamkeitstest geben, wenn Sie diesen nicht bestehen, ist
              Ihre Teilnahme an der Studie leider beendet und Sie können keine VP-Stunden
              mehr bekommen.
            </p>
            <p>
            Ihre Aufgabe ist es, dieses Symbol entlang der Strecke zu suchen, aber
            trotzdem das Verkehrsgeschehen aufmerksam zu verfolgen.
            </p>

            <img
              className="example"
              src={exampleImageUrl}
              alt="Beispielbild für die Symbole die zu suchen sind"
            />

            <p>
              Stellen Sie sich vor, Sie sitzen am Steuer und suchen zum Beispiel eine bestimmte
              Straße. Das heißt, Sie achten auf die Umgebung, müssen aber gleichzeitig den
              Verkehr beobachten, um keinen Unfall zu verursachen.  Am Ende jeder Video-Sequenz,
              sollen Sie jeweils beantworten, ob Sie das Dreieck in der Szene gesehen haben oder
              nicht. Also achten Sie auf das Symbol, aber auch auf Ihre Umgebung.
            </p>
            <p>
              Zu Beginn der Studie wird es einen Übungsdurchlauf geben, damit Sie sich an die
              Situation gewöhnen können. Mit einem Klick auf „Weiter“, geht die Studie los.
            </p>
            <p>
              Noch einmal vielen Dank für Ihre Teilnahme und viel Spaß!
            </p>
          </Fragment>
        )}

        {group === 'b' && (
          <Fragment>
            <p>
              In der Studie geht es darum, Ihre Aufmerksamkeit im Straßenverkehr zu testen und ob zum Beispiel autonom-fahrende Autos diese beeinflussen könnten. Dazu werden Sie einige kurze Video-Sequenzen einer Straßenszene sehen und im Anschluss eine Frage beantworten. Es ist uns wichtig, dass Sie sich ganz auf den Verkehr und Ihre Aufgabe konzentrieren, wenn Sie die Videos anschauen. Ab und zu wird es einen kleinen Aufmerksamkeitstest geben, wenn Sie diesen nicht bestehen, ist Ihre Teilnahme an der Studie leider beendet und Sie können keine VP-Stunden mehr bekommen.
            </p>
            <p>
              Ihre Aufgabe ist es, dieses Symbol entlang der Strecke zu suchen, aber trotzdem das Verkehrsgeschehen und insbesondere die autonomen Autos aufmerksam zu verfolgen.
            </p>

            <img
              className="example"
              src={exampleImageUrl}
              alt="Beispielbild für die Symbole die zu suchen sind"
            />

            <p>
              Stellen Sie sich vor, Sie sitzen am Steuer und suchen zum Beispiel eine bestimmte Straße. Das heißt, Sie achten auf die Umgebung, müssen aber gleichzeitig den Verkehr beobachten, um keinen Unfall zu verursachen.  Am Ende jeder Video-Sequenz, sollen Sie jeweils beantworten, ob Sie das Dreieck in der Szene gesehen haben oder nicht. Also achten Sie auf das Symbol und gleichzeitig darauf, ob Ihnen Besonderheiten am Verhalten der selbstfahrenden Autos in Ihrer Umgebung auffallen.
            </p>
            <p>
              Zu Beginn der Studie wird es einen Übungsdurchlauf geben, damit Sie sich an die Situation gewöhnen können. Mit einem Klick auf „Weiter“, geht die Studie los.
            </p>
            <p>
              Noch einmal vielen Dank für Ihre Teilnahme und viel Spaß!
            </p>
          </Fragment>
        )}

        <ButtonBar align="center">
          <Button onClick={this.handleNext}>
            Weiter
          </Button>
        </ButtonBar>

        <style jsx>{`
          .top-spacer {
            flex: 1;
            max-height: 64px;
          }

          .example {
            width: 100%;
            height: auto;
          }
        `}</style>
      </Content>
    );
  }
}
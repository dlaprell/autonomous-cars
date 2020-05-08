// @ts-check

/** @jsx h */

import { h, Component } from 'preact';
import { Content, Button, ButtonBar } from './Ui';

export default class IntroPage extends Component {
  constructor(...args) {
    super(...args);

    this.state = {
      agreed: false
    };

    this.handleAgreementChange = (evt) => {
      const { checked } = evt.target;

      this.setState({
        agreed: checked
      });
    };

    this.submitResult = (evt) => {
      evt.preventDefault();

      const { onNext } = this.props;
      if (onNext) {
        onNext();
      }
    }
  }

  render() {
    const { footer } = this.props;
    const {
      agreed
    } = this.state;

    return (
      <Content footer={footer}>
        <form onSubmit={this.submitResult}>
          <div className="top-spacer" />

          <h1>
            Studie
          </h1>

          <p>
            Herzlich willkommen zur … Studie. Vielen Dank für Ihr Interesse an dieser Studie.
            Die Teilnahme dauert ungefähr 30 bis 40 Minuten und wenn Sie Psychologie an der
            Heinrich-Heine Universität studieren, können Sie am Ende der Studie Ihre
            E-Mail Adresse angeben und zwei halbe VP-Stunden erhalten. Die E-Mail Adresse
            wird separat von Ihren Daten gespeichert.
          </p>
          <p>
            Die Teilnahme an der Studie ist freiwillig. Sie können jederzeit ohne Angabe von Gründen
            abbrechen, ohne dass Ihnen dadurch ein Nachteil entsteht. Ihre Teilnahme ist mit keinen
            vorhersehbaren Risiken verbunden. Sollten Sie jedoch zu irgendeinem Zeitpunkt nachteilige
            Auswirkungen feststellen, empfehlen wir Ihnen, die Studie zu beenden, indem Sie Ihren
            Webbrowser schließen. Dann können allerdings auch keine VP-Stunden bescheinigt werden.
          </p>
          <p>
            Ihre Angaben werden streng vertraulich behandelt und ausgewertet.
            Alle Mitglieder unseres Forschungsteams wurden in Belangen des Datenschutzes
            unterwiesen und unterliegen der Schweigepflicht.
          </p>
          <p>
            Alle erhobenen Daten werden auf verschlüsselten Datenträgern (AES-256 Bit) gespeichert.
            Die Daten werden auf den Rechnern der Abteilung für Mathematische und Kognitive
            Psychologie verarbeitet und ausgewertet. Möglicherweise werden diese elektronischen Daten
            (ohne individuellen Code) außerdem anderen Personen in Europa und im
            außereuropäischen Ausland zur Datenauswertung zur Verfügung gestellt
            (beispielsweise in Langzeitarchiven). Nach dem derzeitigen Stand der Erkenntnisse ist es
            anhand Ihrer Daten Dritten praktisch nicht möglich, auf Ihre Identität zu schließen.
          </p>
          <p>
            Wir planen, die Ergebnisse dieser Studie in Fachzeitschriften und Büchern zu veröffentlichen.
            Auf Basis dieser Publikationen kann nicht durch Dritte auf Ihre Identität
            geschlossen werden. Wenn Sie an diesen Veröffentlichungen interessiert sind,
            oder für weitere Einzelheiten zu dieser Studie, wenden Sie sich bitte an{' '}
            <a href="mailto:Julie.Niziurski@hhu.de">Dr. Julie A. Niziurski (Julie.Niziurski@hhu.de)</a>.
          </p>
          <p>
            Wenn Sie einverstanden sind, klicken Sie bitte nun auf den Button „Einverstanden“:
          </p>

          <fieldset>
            <label>
              <input
                type="checkbox"
                name="agree"
                checked={agreed}
                onChange={this.handleAgreementChange}
              />
              <i>
                Hiermit bestätige ich meine freiwillige Teilnahme an dieser Umfrage. Ich habe alle Informationen verstanden.
                Ich bin darüber informiert worden, dass ich den Versuch jederzeit ohne Angabe von Gründen beenden kann,
                ohne dass mir dadurch Nachteile entstehen. Ich verzichte auf mein dauerhaftes Widerrufsrecht.
              </i>
            </label>
          </fieldset>

          <ButtonBar align="center">
            <Button type="submit" disabled={!agreed}>
              Einverstanden
            </Button>
          </ButtonBar>
        </form>

        <style jsx>{`
          form {
            display: flex;
            flex-direction: column;
            min-height: 100%;
            padding: 8px;
          }

          .top-spacer {
            flex: 1;
            max-height: 64px;
          }

          fieldset {
            padding: 0 16px;
            margin: 16px 0;
          }

          label {
            display: block;
            padding: 12px 0;
          }

          label span {
            margin-left: 16px;
          }

          input {
            margin-right: 5px;
          }

          label[data-disabled="true"] {
            color: #BBB;
          }
        `}</style>
      </Content>
    );
  }
}
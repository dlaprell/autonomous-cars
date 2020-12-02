// @ts-check

/** @jsx h */

import { h, Component } from 'preact';
import { Content, Button, ButtonBar } from './Ui';

export default class IntroPage extends Component {
  constructor(...args) {
    super(...args);

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

    return (
      <Content footer={footer}>
        <form onSubmit={this.submitResult}>
          <h6>
            Wichtig: Wenn Sie an einer Farbsehschwäche leiden, können Sie leider nicht an dieser Studie teilnehmen.
          </h6>

          <h6>
           Bitte nehmen Sie nur an einem Laptop oder Computer teil, da ein Handybildschirm zu klein ist.
          </h6>

          <div className="top-spacer" />

          <h1>
            Wie aufmerksam bist Du?
          </h1>

          <p>
            Herzlich willkommen zu dieser Aufmerksamkeitsstudie. Vielen Dank für Ihr
            Interesse an dieser Studie. Die Teilnahme dauert ungefähr 15 bis 20 Minuten und
            wenn Sie Psychologie an der Heinrich-Heine-Universität studieren, können Sie am
            Ende der Studie Ihre E-Mail-Adresse angeben und eine halbe VP-Stunde erhalten.
            Die E-Mail-Adresse wird separat von Ihren Daten gespeichert und nicht an Dritte
            weitergegeben. 
          </p>
          <p>
            Die Teilnahme an der Studie ist freiwillig. Sie müssen mindestens 18 Jahre alt sein und
            dürfen keine Farbsehschwäche haben. Für diese Studie wird kein Ton benötigt.
            Sie können jederzeit ohne Angabe von Gründen
            abbrechen, ohne dass Ihnen dadurch ein Nachteil entsteht. Ihre Teilnahme ist mit keinen
            vorhersehbaren Risiken verbunden. Sollten Sie jedoch zu irgendeinem Zeitpunkt nachteilige
            Auswirkungen feststellen, empfehlen wir Ihnen, die Studie zu beenden, indem Sie Ihren
            Webbrowser schließen. Dann können allerdings auch keine VP-Stunden bescheinigt werden.
          </p>
          <p>
            Ihre Angaben werden streng vertraulich behandelt und ausgewertet. Alle Mitglieder unseres
            Forschungsteams wurden in Belangen des Datenschutzes unterwiesen und unterliegen der
            Schweigepflicht. 
          </p>
          <p>
            Bei der Erhebung der Daten wird an keiner Stelle Ihr Name erfragt. Ebenso wird Ihre
            IP-Adresse nicht gespeichert. Wir erfragen Ihr Alter, Ihr Geschlecht und ob Sie einen
            Führerschein besitzen. Alle diese Angaben werden anonym und ohne die Möglichkeit auf
            Rückschlüsse zu Ihrer Person gespeichert.
          </p>
          <p>
            Alle erhobenen Daten werden auf verschlüsselten Datenträgern (AES-256 Bit) gespeichert.
            Die Daten werden auf den Rechnern der Abteilung für Mathematische und Kognitive
            Psychologie verarbeitet und ausgewertet. Möglicherweise werden diese elektronischen
            Daten (ohne individuellen Code) außerdem anderen Personen in Europa und im
            außereuropäischen Ausland zur Datenauswertung zur Verfügung gestellt (beispielsweise in
            Langzeitarchiven). Nach dem derzeitigen Stand der Erkenntnisse ist es anhand Ihrer
            Daten Dritten praktisch nicht möglich, auf Ihre Identität zu schließen.
          </p>
          <p>
            Wir planen, die Ergebnisse dieser Studie in Fachzeitschriften und Büchern zu
            veröffentlichen. Auf Basis dieser Publikationen kann nicht durch Dritte auf
            Ihre Identität geschlossen werden. Wenn Sie an diesen Veröffentlichungen
            interessiert sind, oder für weitere Einzelheiten zu dieser Studie, wenden Sie
            sich bitte an Dr. Julie A. Niziurski (<a href="mailto:Julie.Niziurski@hhu.de">Julie.Niziurski@hhu.de</a>).
          </p>

          <p>
            Diese Studie wurde von einer vollständigen Ethikprüfung durch die Ethikkommission der Heinrich-Heine-Universität Düsseldorf ausgenommen.
          </p>
          <p>
            Wenn Sie noch Fragen haben, können Sie diese an die Projektleiterin wenden:
          </p>
          <p>
            Dr. Julie A. Niziurski<br />
            Abteilung für Mathematische und Kognitive Psychologie<br />
            Heinrich-Heine-Universität Düsseldorf<br />
            <a href="https://www.psychologie.hhu.de/arbeitsgruppen/mathematische-und-kognitive-psychologie/arbeitsgruppe.html">
              www.psychologie.hhu.de/arbeitsgruppen/mathematische-und-kognitive-psychologie/arbeitsgruppe.html
            </a>
          </p>

          <p>
            Die Datenschutzbeauftragte erreichen Sie unter <a href="mailto:Datenschutzbeauftragter@hhu.de">Datenschutzbeauftragter@hhu.de</a>. Das Beschwerderecht bei der zuständigen Aufsichtsbehörde bleibt Ihnen vorbehalten.
          </p>

          <p>
            Wenn Sie einverstanden sind, klicken Sie bitte nun auf den Button „Einverstanden“:
          </p>

          <p>
            <i>
              Hiermit bestätige ich meine freiwillige Teilnahme an dieser Umfrage. Ich habe alle Informationen verstanden. Ich bin darüber informiert worden, dass ich den Versuch jederzeit ohne Angabe von Gründen beenden kann, ohne dass mir dadurch Nachteile entstehen. Ich verzichte auf mein dauerhaftes Widerrufsrecht. Außerdem bestätige ich, dass ich mindestens 18 Jahre oder älter bin.
            </i>
          </p>

          <ButtonBar align="center">
            <Button type="submit">
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
        `}</style>
      </Content>
    );
  }
}
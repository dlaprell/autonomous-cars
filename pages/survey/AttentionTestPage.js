// @ts-check

/** @jsx h */

import { h, Component, Fragment } from 'preact';
import { Content, Button, ButtonBar } from './Ui';

export default class IntroPage extends Component {
  constructor(...args) {
    super(...args);

    this.iid = null;

    this.state = {
      secondsLeft: 10
    };

    this.handleNextClick = () => {
      const { secondsLeft } = this.state;

      if (secondsLeft < -2) {
        // Give persons a bit more time than actually displayed
        // -> browser could have had a lag etc during clicking
        return;
      }

      const { onNext } = this.props;
      if (onNext) {
        onNext();
      }
    };
  }

  clearInterval() {
    if (this.iid) {
      window.clearInterval(this.iid);
      this.idd = null;
    }
  }

  componentDidMount() {
    this.iid = window.setInterval(() => {
      this.setState(st => ({
        secondsLeft: st.secondsLeft - 1
      }));
    }, 1000);
  }

  componentWillUnmount() {
    this.clearInterval();
  }

  render() {
    const { footer } = this.props;
    const {
      secondsLeft
    } = this.state;

    return (
      <Content footer={footer}>
        <div className="top-spacer" />

        <h1>
          Aufmerksamkeitstest
        </h1>

        {secondsLeft >= -2 ? (
          <Fragment>
            <p>
              Bitte klicken Sie innerhalb der nächsten <strong>{Math.max(secondsLeft, 0)}</strong> Sekunden
              auf "Super".
            </p>

            <ButtonBar align="center">
              <Button >
                Weiter
              </Button>
            </ButtonBar>


            <ButtonBar align="center">
              <Button onClick={this.handleNextClick}>
                Super
              </Button>
            </ButtonBar>

            <ButtonBar align="center">
              <Button >
                Hallo
              </Button>
            </ButtonBar>
          </Fragment>
        ) : (
          <p>
            Sie haben den Aufmerksamkeitstest leider nicht bestanden. Sie können diesen Durchlauf der
            Studie daher nicht beenden.
          </p>
        )}

        <style jsx>{`
          .top-spacer {
            flex: 1;
            max-height: 64px;
          }

          strong {
            font-weight: 600;
          }
        `}</style>
      </Content>
    );
  }
}
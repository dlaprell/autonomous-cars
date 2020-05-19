// @ts-check

/** @jsx h */

import { h, Component } from 'preact';
import { Content, Button, ButtonBar } from './Ui';
import { assert } from '../../components/utils/assert';

const UI_STATE = {
  Q_CAR: 'q_car',
  Q_TARGET: 'q_target'
};

export default class RunResult extends Component {
  constructor(...args) {
    super(...args);

    const { group } = this.props;
    assert(group === 'a' || group === 'b');

    this.state = {
      uiState: group === 'b' ? UI_STATE.Q_CAR : UI_STATE.Q_TARGET,

      answerTarget: null,
      answerCar: null
    };

    this.handleAnswerChange = (evt) => {
      const { value } = evt.target;

      assert(value !== 'unspecified');

      this.setState(st => {
        const answer = value === 'yes';
        return st.uiState == UI_STATE.Q_CAR ? { answerCar: answer } : { answerTarget: answer };
      });
    };

    this.submitResult = (evt) => {
      evt.preventDefault();
      const { onResult } = this.props;
      const { uiState } = this.state;

      if (uiState === UI_STATE.Q_CAR) {
        this.setState({ uiState: UI_STATE.Q_TARGET });
      } else if (onResult) {
        const { answerCar, answerTarget } = this.state;
        onResult({
          car: answerCar,
          target: answerTarget
        });
      }
    }
  }

  render() {
    const { footer, buttonText, group } = this.props;
    const { answerCar, answerTarget, uiState } = this.state;

    assert(group === 'a' || group === 'b');

    const curAnswer = uiState === UI_STATE.Q_CAR ? answerCar : answerTarget;

    return (
      <Content footer={footer}>
        <form onSubmit={this.submitResult}>
          <div className="top-spacer" />

          {uiState === UI_STATE.Q_CAR && (
            <p>
              Haben Sie ein fahrerloses Auto in der vorherigen Szene gesehen?
            </p>
          )}
            
          {uiState === UI_STATE.Q_TARGET && (
            <p>
              Haben Sie das grüne Dreieck in der vorherigen Szene gesehen?
            </p>
          )}

          <fieldset>
            <label>
              <input
                type="radio"
                name="answer"
                value="yes"
                checked={curAnswer === true}
                onChange={this.handleAnswerChange}
              />
              <span>
                Ja, ich habe es gesehen.
              </span>
            </label>

            <label>
              <input
                type="radio"
                name="answer"
                value="no"
                checked={curAnswer === false}
                onChange={this.handleAnswerChange}
              />
              <span>
                Nein, ich habe es nicht gesehen.
              </span>
            </label>
          </fieldset>

          <ButtonBar align="center">
            <Button type="submit" disabled={curAnswer === null}>
              {buttonText || 'Weiter'}
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

          label[data-disabled="true"] {
            color: #BBB;
          }
        `}</style>
      </Content>
    );
  }
}
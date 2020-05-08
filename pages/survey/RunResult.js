// @ts-check

/** @jsx h */

import { h, Component } from 'preact';
import { Content, Button, ButtonBar } from './Ui';
import { assert } from '../../components/utils/assert';

export default class RunResult extends Component {
  constructor(...args) {
    super(...args);

    this.state = {
      answer: null
    };

    this.handleAnswerChange = (evt) => {
      const { value } = evt.target;

      assert(value !== 'unspecified');

      this.setState({
        answer: value === 'yes'
      });
    };

    this.submitResult = (evt) => {
      evt.preventDefault();
      const { onResult } = this.props;
      if (onResult) {
        const { answer } = this.state;
        onResult(answer);
      }
    }
  }

  render() {
    const { footer } = this.props;
    const { answer } = this.state;

    return (
      <Content footer={footer}>
        <form onSubmit={this.submitResult}>
          <div className="top-spacer" />

          <p>
            Haben Sie das grüne Dreieck in der vorherigen Szene gesehen?
          </p>

          <fieldset>
            <label>
              <input
                type="radio"
                name="answer"
                value="yes"
                checked={answer === true}
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
                checked={answer === false}
                onChange={this.handleAnswerChange}
              />
              <span>
                Nein, ich habe es nicht gesehen.
              </span>
            </label>
          </fieldset>

          <ButtonBar align="center">
            <Button type="submit" disabled={answer === null}>
              Nächste Szene
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
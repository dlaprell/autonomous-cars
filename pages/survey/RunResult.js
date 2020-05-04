// @ts-check

/** @jsx h */

import { h, Component } from 'preact';
import { Content } from './Ui';
import { assert } from '../../components/utils/assert';

export default class RunResult extends Component {
  constructor(...args) {
    super(...args);

    this.state = {
      answer: null
    };

    this.handleAnswertChange = (evt) => {
      const { value } = evt.target;

      assert(value !== 'unspecified');

      this.setState({
        answer: value === 'yes'
      });
    };

    this.submitResult = () => {
      const { onResult } = this.props;
      if (onResult) {
        const { answer } = this.state;
        onResult(answer);
      }
    }
  }

  render() {
    const { answer } = this.state;

    return (
      <Content nextDisabled={answer === null} onNextClick={this.submitResult}>
        <form>
          <p>Question formulation here:</p>

          <fieldset>
            <label>
              <input
                type="radio"
                name="answer"
                value="yes"
                checked={answer === true}
                onChange={this.handleAnswertChange}
              />
              <span>Yes</span>
            </label>

            <label>
              <input
                type="radio"
                name="answer"
                value="no"
                checked={answer === false}
                onChange={this.handleAnswertChange}
              />
              <span>No</span>
            </label>

            <label data-disabled={answer !== null}>
              <input
                type="radio"
                name="answer"
                value="unspecified"
                checked={answer === null}
                disabled={answer !== null}
                onChange={this.handleAnswertChange}
              />
              <span>Please select your answer</span>
            </label>
          </fieldset>
        </form>

        <style jsx>{`
          fieldset {
            padding: 0 16px;
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
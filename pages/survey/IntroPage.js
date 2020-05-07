// @ts-check

/** @jsx h */

import { h, Component } from 'preact';
import { Content, Button, ButtonBar } from './Ui';
import { assert } from '../../components/utils/assert';

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

      const { onStart } = this.props;
      if (onStart) {
        onStart({});
      }
    }
  }

  render() {
    const { footer } = this.props;
    const { agreed } = this.state;

    return (
      <Content footer={footer}>
        <form onSubmit={this.submitResult}>
          <div className="top-spacer" />

          <h1>
            Survey
          </h1>

          <fieldset>
            <label>
              <input
                type="checkbox"
                name="agree"
                checked={agreed}
                onChange={this.handleAgreementChange}
              />
              Yes, I agree ...
            </label>
          </fieldset>

          <ButtonBar align="center">
            <Button type="submit" disabled={!agreed}>
              Start
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
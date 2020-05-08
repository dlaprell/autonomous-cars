// @ts-check

/** @jsx h */

import { h, Component } from 'preact';
import linkState from 'linkstate';
import { Content, Button, ButtonBar } from './Ui';
import { assert } from '../../components/utils/assert';

export default class IntroPage extends Component {
  constructor(...args) {
    super(...args);

    this.state = {
      agreed: false,
      driverLicense: null,
      age: ''
    };

    this.handleDriverLicenseChange = (evt) => {
      const { checked, value } = evt.target;

      const has = checked && value === 'yes';
      this.setState({
        driverLicense: has
      });
    };

    this.handleAgreementChange = (evt) => {
      const { checked } = evt.target;

      this.setState({
        agreed: checked
      });
    };

    this.submitResult = (evt) => {
      evt.preventDefault();

      const {
        driverLicense, age
      } = this.state;

      const { onStart } = this.props;
      if (onStart) {
        onStart({
          driverLicense,
          age: Math.round(Number(age))
        });
      }
    }
  }

  render() {
    const { footer } = this.props;
    const {
      agreed,
      driverLicense,
      age
    } = this.state;

    const dataReady = (
      age !== '' && !isNaN(Number(age)) && Number(age) > 0 && Number(age) <= 130
      && driverLicense !== null
    );

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
                type="radio"
                name="driverLicense"
                value="yes"
                onChange={this.handleDriverLicenseChange}
                checked={driverLicense === true}
              />

              Yes, driver license
            </label>

            <label>
              <input
                type="radio"
                name="driverLicense"
                value="no"
                onChange={this.handleDriverLicenseChange}
                checked={driverLicense === false}
              />

              No, driver license
            </label>
          </fieldset>

          <fieldset>
            <label htmlFor="age">
              Age
            </label>
            <input
              type="number"
              name="age"
              value={age}
              id="age"
              onInput={linkState(this, 'age')}
            />
          </fieldset>

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
            <Button type="submit" disabled={!agreed || !dataReady}>
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
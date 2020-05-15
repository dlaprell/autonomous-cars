// @ts-check

/** @jsx h */

import { h, Component } from 'preact';
import linkState from 'linkstate';
import { Content, Button, ButtonBar, Textbox } from './Ui';

export default class IntroPage extends Component {
  constructor(...args) {
    super(...args);

    this.state = {
      agreed: false,
      driverLicense: null,
      gender: null,
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

    this.handleGenderChange = (evt) => {
      const { value } = evt.target;

      this.setState({
        gender: value
      });
    }

    this.submitResult = (evt) => {
      evt.preventDefault();

      const {
        driverLicense, age, gender
      } = this.state;

      const { onNext } = this.props;
      if (onNext) {
        onNext({
          driverLicense,
          age: Math.round(Number(age)),
          gender
        });
      }
    }
  }

  render() {
    const { footer } = this.props;
    const {
      driverLicense,
      age,
      gender
    } = this.state;

    const invalidAge = age === '' ? false : (isNaN(Number(age)) || Number(age) <= 17 || Number(age) > 130);
    const validAge = age !== '' && !invalidAge;

    const dataReady = (
      validAge && driverLicense !== null && gender !== null
    );

    return (
      <Content footer={footer}>
        <form onSubmit={this.submitResult}>
          <div className="top-spacer" />

          <h1>
            Allgemeine Angaben
          </h1>

          <p>
            Zunächst bitten wir Sie, ein paar allgemeine Fragen zu beantworten:
          </p>

          <fieldset>
            <p>
              Sind Sie im Besitz eines gültigen Führerscheins zum Führen eines Fahrzeugs?
            </p>

            <label>
              <input
                type="radio"
                name="driverLicense"
                value="yes"
                required
                onChange={this.handleDriverLicenseChange}
                checked={driverLicense === true}
              />

              Ja, ich habe einen Führerschein.
            </label>

            <label>
              <input
                type="radio"
                name="driverLicense"
                value="no"
                required
                onChange={this.handleDriverLicenseChange}
                checked={driverLicense === false}
              />

              Nein, ich habe keinen.
            </label>
          </fieldset>

          <fieldset>
            <Textbox
              type="number"
              name="age"
              label="Ihr Alter"
              value={age}
              error={invalidAge}
              required
              onInput={linkState(this, 'age')}
            />
          </fieldset>

          <fieldset>
            <label>
              <input
                type="radio"
                name="gender"
                value="male"
                checked={gender === 'male'}
                onChange={this.handleGenderChange}
              />
              <span>
               Männlich
              </span>
            </label>

            <label>
              <input
                type="radio"
                name="gender"
                value="female"
                checked={gender === 'female'}
                onChange={this.handleGenderChange}
              />
              <span>
               Weiblich
              </span>
            </label>

            <label>
              <input
                type="radio"
                name="gender"
                value="diverse"
                checked={gender === 'diverse'}
                onChange={this.handleGenderChange}
              />
              <span>
               Divers
              </span>
            </label>
          </fieldset>

          <ButtonBar align="center">
            <Button type="submit" disabled={!dataReady}>
              Weiter
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

          input {
            margin-right: 5px;
          }
        `}</style>
      </Content>
    );
  }
}
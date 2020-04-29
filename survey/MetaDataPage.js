/** @jsx h */

import { h, Component } from 'preact';

class MetaDataPage extends Component {
  constructor(...args) {
    super(...args);

    this.state = {
      driverLicense: false,
      age: null
    };
  }

  render() {
    const { driverLicense, age } = this.state;

    return (
      <div>
        <label>
          <input type="checkbox" checked={driverLicense} name="driverLicense" />
        </label>

        <label>
          <input type="number" min="0" max="130" value={age} name="age" />
        </label>
      </div>
    );
  }
}

export { MetaDataPage };
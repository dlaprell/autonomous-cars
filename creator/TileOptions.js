/** @jsx h */
import { h, Component } from 'preact';
import { rotate } from '../components/src/utils';

const types = {
  'plain': { value: 0, name: 'Grass' },
  'road': { value: 1, name: 'Street' },
  'curve': { value: 2, name: 'Curve' },
  'tsection': { value: 3, name: 'T - Intersection' },
  'cross': { value: 4, name: 'Cross' },
  'forest': { value: 20, name: 'Forest' },
  'house': { value: 30, name: 'House' }
}

function Option({ label, children }) {
  return (
    <div className="option">
      <label className="label">
        {label}
      </label>
      <div className="content">
        {children}
      </div>

      <style jsx>{`
        .option {
          display: flex;
          flex-direction: row;
          overflow-x: hidden;

          padding: 6px 12px;
        }

        .label {
          width: 120px;
          flex: 0 0 auto;
        }

        .content {
          flex: 1;
        }

        .content > :global(input), .content > :global(select) {
          width: 100%;
        }
      `}</style>
    </div>
  );
}

function SelectOption({ label, name, disabled, choices, value, onChange }) {
  return (
    <Option label={label}>
      <select
        disabled={Boolean(disabled) || !onChange}
        value={value}
        onChange={onChange}
        name={name}
      >
        {choices.map(({ value, name }) => (
          <option key={value} value={value}>
            {name || value}
          </option>
        ))}
      </select>
    </Option>
  );
}

function CheckBoxOption({ label, name, disabled, checkedText, value, onChange }) {
  return (
    <Option label={label}>
      <label>
        <input
          disabled={Boolean(disabled) || !onChange}
          type="checkbox"
          checked={value}
          onChange={onChange}
          name={name}
        />
        {checkedText}
      </label>

      <style jsx>{`
        input {
          margin-right: 5px;
        }
      `}</style>
    </Option>
  );
}

class RotationOption extends Component {
  constructor(...args) {
    super(...args);

    this.handleRotateLeft = () => {
      const { rotation, onChange } = this.props;

      if (onChange) {
        onChange(rotate(rotation, -1));
      }
    };

    this.handleRotateRight = () => {
      const { rotation, onChange } = this.props;

      if (onChange) {
        onChange(rotate(rotation, 1));
      }
    };

    this.handleRotationChange = (evt) => {
      const { onChange } = this.props;

      if (onChange) {
        onChange(Number(evt.target.value));
      }
    };
  }

  render() {
    const { rotation } = this.props;

    return (
      <Option label="Orientation">
        <div className="wrapper">
          <select value={rotation} onChange={this.handleRotationChange}>
            <option value={0}>0°</option>
            <option value={-1}>-90°</option>
            <option value={1}>90°</option>
            <option value={2}>180°</option>
          </select>

          <button type="button" onClick={this.handleRotateLeft}>
            {"\u27f2"}
          </button>
          <button type="button" onClick={this.handleRotateRight}>
            {"\u27f3"}
          </button>
        </div>

        <style jsx>{`
          .wrapper {
            display: flex;
            flex-direction: row;
          }

          select {
            flex: 1;
            margin-right: 6px;
          }

          button {
            flex: 0 0 auto;
          }
        `}</style>
      </Option>
    );
  }
}

class TileOptions extends Component {
  constructor(...args) {
    super(...args);

    this.handleRotationChange = r => {
      const { tile, onChange } = this.props;

      if (onChange) {
        onChange([ tile[0], r, tile[3] ]);
      }
    }

    this.handleTypeChange = evt => {
      const type = Number(evt.target.value);

      const { tile, onChange } = this.props;
      if (onChange) {
        onChange([
          type,
          tile[1],
          {
            /* TODO: determine defaults */
            seed: (tile[2] && tile[2].seed) || 0
          }
        ]);
      }
    }

    this.handleOptionChange = evt => {
      const { type, checked, value, name } = evt.target;

      let realValue = type === 'checkbox' ? checked : value;

      if (type === 'number') {
        realValue = Number(realValue);
      }

      const { tile, onChange } = this.props;
      if (onChange) {
        onChange([
          tile[0],
          tile[1],
          { ...(tile[2] || {}), [name]: realValue }
        ]);
      }
    }
  }

  render() {
    const { tile } = this.props;

    const type = tile[0];
    const disDecorations = (type === types.cross.value || type === types.tsection.value)

    const options = tile[2] || {};

    return (
      <div>
        <SelectOption
          label="Type"
          name="type"
          value={type}
          choices={Object.values(types)}
          onChange={this.handleTypeChange}
        />

        <RotationOption
          rotation={tile[1]}
          onChange={this.handleRotationChange}
        />

        <div className="spacer" />

        <CheckBoxOption
          label="Trashcan"
          value={options.trashCan}
          checkedText="Show"
          disabled={disDecorations}
          name="trashCan"
          onChange={this.handleOptionChange}
        />

        <CheckBoxOption
          label="Bench"
          value={options.bench}
          checkedText="Show"
          disabled={disDecorations}
          name="bench"
          onChange={this.handleOptionChange}
        />

        <SelectOption
          label="House Type"
          name="houseType"
          value={options.type || 'Simple'}
          disabled={type !== types.house.value}
          choices={[
            { value: 'Simple' },
            { value: 'Flat' },
            { value: 'Double' },
            { value: 'Bungalow' }
          ]}
          onChange={this.handleOptionChange}
        />

        <div className="spacer" />

        <style jsx>{`
          .spacer {
            height: 24px;
          }
        `}</style>
      </div>
    );
  }
}

export {
  TileOptions
};
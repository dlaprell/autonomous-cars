/** @jsx h */
import { h, Component } from 'preact';
import { rotate } from '../../components/src/utils';

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
    const { rotation, name, label } = this.props;

    return (
      <Option label={label || 'Orientation'}>
        <div className="wrapper">
          <select value={rotation} onChange={this.handleRotationChange} name={name}>
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

export {
  Option,
  SelectOption,
  RotationOption,
  CheckBoxOption
};
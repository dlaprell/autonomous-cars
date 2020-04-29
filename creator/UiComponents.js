/** @jsx h */
import { h } from 'preact';

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

export {
  Option,
  SelectOption,
  CheckBoxOption
};
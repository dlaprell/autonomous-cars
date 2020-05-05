/** @jsx h */
import { h, Component, Fragment } from 'preact';

import { RotationOption, SelectOption, CheckBoxOption, Option } from './UiComponents';
import { assert } from '../../components/utils/assert';

const types = {
  'plain': { value: 0, name: 'Grass' },
  'road': { value: 1, name: 'Street', streetSides: [ 0, 2 ], decorationLocations: [ 'topLeft', 'bottomLeft' ] },
  'curve': { value: 2, name: 'Curve', streetSides: [ 1, 2 ] },
  'tsection': { value: 3, name: 'T - Intersection', streetSides: [ 0, 1, 2 ], decorationLocations: [ 'topLeft', 'bottomLeft' ] },
  'cross': { value: 4, name: 'Cross', streetSides: [ 0, 1, 2, -1 ] },
  'forest': { value: 20, name: 'Forest', decorationLocations: [ 'topLeft', 'topRight' ] },
  'house': { value: 30, name: 'House', decorationLocations: [ 'topLeft', 'topRight' ] }
}

const typesByValue = Object
  .fromEntries(
    Object
      .values(types)
      .map(a => [ a.value, a ])
  );

const decorationTypes = {
  trashcan: {
    name: 'Trashcan'
  },
  bench: {
    name: 'Bench'
  }
};

function extractDecorationOptions(tile) {
  const { bench, trashCan, decorations } = (tile[2] || {});

  if (decorations) {
    return decorations;
  }

  const type = typesByValue[tile[0]];
  if (!type.decorationLocations || type.decorationLocations.length === 0) {
    return {};
  }

  const dec = {};

  for (const side of type.decorationLocations) {
    dec[side] = null;
  }

  if (bench) {
    let side;

    // top right for forest / house; road bottom left
    if (type.value === types.road.value || type.value === types.tsection.value) {
      side = 'bottomLeft';
    } else {
      side = 'topRight';
    }

    dec[side] = {
      type: 'bench',
      ...(bench && typeof bench === 'object' ? bench : {})
    };
  }

  if (trashCan) {
    let side;

    if (type.value === types.road.value || type.value === types.tsection.value) {
      side = 'topLeft';
    } else {
      side = 'topLeft';
    }

    dec[side] = {
      type: 'trashcan',
      ...(trashCan && typeof trashCan === 'object' ? trashCan : {})
    };
  }

  return dec;
}

class DecorationOptions extends Component {
  constructor(...args) {
    super(...args);

    this.handleTypeChange = (evt) => {
      const { location, onChange } = this.props;
      const { value } = evt.target;

      if (!onChange) {
        return;
      }

      onChange(
        value === '' ? null : { type: value },
        location
      )
    };

    this.handleOptionChange = (evt) => {
      const { options, type, location, onChange } = this.props;

      if (!onChange) {
        return;
      }

      const newOpt = { type };

      if (!evt.target) {
        newOpt.rotation = evt;
      } else {
        const [ _, name ] = evt.target.name.split('.');

        let { type, value, checked } = evt.target;
        if (type === 'checkbox') {
          value = checked;
        }

        newOpt[name] = value;
      }

      onChange({ ...options, ...newOpt }, location);
    };
  }

  render() {
    const { options, type, location } = this.props;

    assert(Boolean(options) === Boolean(type));

    return (
      <div>
        <SelectOption
          label="Decoration"
          name={`${location}.type`}
          value={type || ''}
          choices={[
            { value: '', name: 'None' },
            ...Object.entries(decorationTypes).map(a => ({ value: a[0], name: a[1].name }))
          ]}
          onChange={this.handleTypeChange}
        />

        {options && (
          <Fragment>
            <CheckBoxOption
              label=""
              value={Boolean(options.target)}
              checkedText="Target"
              name={`${location}.target`}
              onChange={this.handleOptionChange}
            />

            <RotationOption
              label=""
              rotation={typeof options.rotation === 'number' ? options.rotation : 0}
              name={`${location}.rotation`}
              onChange={this.handleOptionChange}
            />
          </Fragment>
        )}
      </div>
    );
  }
}

class TileOptions extends Component {
  constructor(...args) {
    super(...args);

    this.handleRotationChange = r => {
      const { tile, onChange } = this.props;

      if (onChange) {
        onChange([ tile[0], r, tile[2] || {} ]);
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

      const { tile, onChange } = this.props;
      const oldOptions = tile[2] || {};

      let realValue = type === 'checkbox' ? checked : value;

      if (type === 'number') {
        realValue = Number(realValue);
      }

      const newOption = {};
      if (name.indexOf('.') !== -1) {
        const [ base, prop ] = name.split('.');

        newOption[base] = typeof oldOptions[base] === 'object'
          ? { ...oldOptions[base] } : {};

        newOption[base][prop] = realValue;
      } else if (typeof realValue === 'string') {
        newOption[name] = realValue;
      } else {
        newOption[name] = realValue ? {} : null;
      }

      if (onChange) {
        onChange([
          tile[0],
          tile[1],
          { ...oldOptions, ...newOption }
        ]);
      }
    };

    this.handleSignChange = evt => {
      const { name, value } = evt.target;
      const nameSplit = name.split('.');

      const side = Number(nameSplit[1]);

      const { tile, onChange } = this.props;
      if (onChange) {
        // First of all, remove the corresponding sign
        const signs = ((tile[2] && tile[2].signs) || [])
          .filter(s => s.side !== side);

        if (value === '') { // None
          // So remove the corresponding item in the list
          onChange([
            tile[0],
            tile[1],
            { ...(tile[2] || {}), signs }
          ]);
        } else {
          onChange([
            tile[0],
            tile[1],
            {
              ...(tile[2] || {}),
              signs: [ ...signs, { type: value, side: side } ]
            }
          ]);
        }
      }
    }

    this.handleDecorationChange = (options, location) => {
      const { tile, onChange } = this.props;

      const dec = extractDecorationOptions(tile);

      if (onChange) {
        onChange([
          tile[0],
          tile[1],
          {
            ...(tile[2] || {}),

            decorations: {
              ...dec,

              [location]: options
            }
          }
        ]);
      }
    };
  }

  render() {
    const { tile } = this.props;

    const type = tile[0];
    const rotation = tile[1] || 0;
    const options = tile[2] || {};

    const disDecorations = (type === types.cross.value || type === types.tsection.value)

    const streetSides = (typesByValue[type].streetSides || []);
    const signs = options.signs || [];

    const dec = extractDecorationOptions(tile);

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
          name="rotation"
          rotation={rotation}
          onChange={this.handleRotationChange}
        />

        {type === types.house.value && (
          <Fragment>
            <div className="spacer" />

            <SelectOption
              label="House Type"
              name="type"
              value={options.type || 'Simple'}
              choices={[
                { value: 'Simple' },
                { value: 'Flat' },
                { value: 'Double' },
                { value: 'Bungalow' }
              ]}
              onChange={this.handleOptionChange}
            />
          </Fragment>
        )}

        <div className="spacer" />

        {[ 0, 1, 2, -1 ].map(side => {
          const signAtSide = signs.find(s => s.side === side) || null;

          const sideName = ({
            '0': 'Top',
            '-1': 'Left',
            '1': 'Right',
            '2': 'Bottom'
          })[side];

          return (
            <SelectOption
              label={`Sign ${sideName}`}
              name={`streetSign.${side}`}
              value={
                !signAtSide ? '' : signAtSide.type
              }
              disabled={streetSides.indexOf(side) === -1}
              choices={[
                { value: '', name: 'None' },
                { value: 'PriorityRoad' },
                { value: 'Stop' },
                { value: 'Yield' },
                { value: 'PriorityAtNext' },
                { value: 'Target' }
              ]}
              onChange={this.handleSignChange}
            />
          );
        })}

        {Object.entries(dec).map(([ location, options ]) => (
          <div key={location}>
            <div className="spacer" />
            <Option>
              <h5>Decoration {location}</h5>
            </Option>

            <DecorationOptions
              location={location}
              type={options ? options.type : ''}
              options={options}
              onChange={this.handleDecorationChange}
            />
          </div>
        ))}

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
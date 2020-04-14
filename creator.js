/** @jsx h */

// Must be the first import
import "preact/debug";

import { Raycaster, Vector2 } from 'three';

import { h, render, Component, Fragment, createRef } from 'preact';
import { Simulation } from './components/Simulation';
import { TYPES } from "./components/src/grid_tiles";
import { rotate } from "./components/src/utils";

const FILL_TILE = [ TYPES.PLAIN, 0, {} ];

function MenuButton({ label, onClick, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

const types = {
  'plain': { value: 0, name: 'Grass' },
  'road': { value: 1, name: 'Street' },
  'curve': { value: 2, name: 'Curve' },
  'tsection': { value: 3, name: 'T - Intersection' },
  'cross': { value: 4, name: 'Cross' },
  'forest': { value: 20, name: 'Forest' },
  'house': { value: 30, name: 'House' }
}

class Creator extends Component {
  constructor(...args) {
    super(...args);

    this._sceneRef = createRef(null);

    this.state = {
      mainRef: null,

      menuOpen: false,
      tile: null,
      menuPosition: null,

      mode: 'camera',
      tileType: 'plain',

      size: 1,
      map: [
        [ FILL_TILE ]
      ]
    };

    this.handleGridSizeChange = this.handleGridSizeChange.bind(this);
    this.updateMainRef = this.updateMainRef.bind(this);
    this.handleModeChange = this.handleModeChange.bind(this);
    this.handleTileTypeChange = this.handleTileTypeChange.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
    
    this.rotateLeft = this.handleRotation.bind(this, -1);
    this.rotateRight = this.handleRotation.bind(this, 1);

    this.exportWorld = this.exportWorld.bind(this);
  }

  updateMainRef(r) {
    this.setState({ mainRef: r });
  }

  handleGridSizeChange(evt) {
    const newSize = Number(evt.target.value);
    if (newSize < 1) {
      return;
    }

    this.setState(({ map, size }) => {
      const diff = newSize - size;

      const newMap = map
        .map(row => {
          if (row.length < newSize) {
            return [ ...row, ...new Array(diff).fill(FILL_TILE) ];
          } else {
            return row.slice(0, newSize);
          }
        })
        .filter((r, idx) => idx < newSize)
        .concat(new Array(Math.max(0, diff)).fill(new Array(newSize).fill(FILL_TILE) ));

      return {
        map: newMap,
        size: newSize
      };
    });
  }

  toggleDecoration(dec) {
    const { tile } = this.state;

    this.setState(({ map }) => ({
      map: map
        .map((row, _y) => (
          _y === tile.y
            ? row
              .map(
                ([ t, rot, o ], _x) =>
                  tile.x === _x ? [ t, rot, { ...o, [dec]: !o[dec] } ] : [ t, rot, o ]
              )
            : row
        ))
    }));
  }

  updateHouse(type) {
    const { tile } = this.state;

    this.setState(({ map }) => ({
      map: map
        .map((row, _y) => (
          _y === tile.y
            ? row
              .map(
                ([ t, rot, o ], _x) =>
                  tile.x === _x ? [ t, rot, { ...o, type } ] : [ t, rot, o ]
              )
            : row
        ))
    }));
  }

  handleRotation(by) {
    const { tile } = this.state;

    this.setState(({ map }) => ({
      map: map
        .map((row, _y) => (
          _y === tile.y
            ? row
              .map(
                ([ t, rot, o ], _x) =>
                  tile.x === _x ? [ t, rotate(rot, by), o ] : [ t, rot, o ]
              )
            : row
        ))
    }));
  }

  handleTileClicked(x, y, left, mouse) {
    if (!left) {
      this.setState({
        menuOpen: true,
        tile: { x, y },
        menuPosition: mouse
      });
      return;
    }

    const type = this.state.tileType;
    const { value } = types[type];

    this.setState(({ map }) => ({
      map: map
        .map((row, _y) => (
          _y === y
            ? row
              .map(
                ([ t, rot, o ], _x) =>
                  x === _x
                    ? [ value, rot, o ] : [ t, rot, o ]
              )
            : row
        ))
    }));
  }

  handleContextMenu(evt) {
    const { mode } = this.state;

    if (mode === 'tile') {
      evt.preventDefault();
      return false;
    }
  }

  handleMouseDown(evt) {
    const { mode, menuOpen } = this.state;

    if (menuOpen) {
      if (!evt.target.parentElement.classList.contains('menu')) {
        this.setState({
          menuOpen: false
        });
      }
      return;
    }

    if (mode !== 'tile') {
      return;
    }

    if (evt.button != 0 && evt.button != 2) {
      return;
    }

    const left = evt.button == 0;

    const { _scene, _camera } = this._sceneRef.current;

    const { mainRef } = this.state;

    const raycaster = new Raycaster();
    const mouse = new Vector2(
      (evt.x / mainRef.clientWidth) * 2 - 1,
	    -(evt.y / mainRef.clientHeight) * 2 + 1
    );

    raycaster.setFromCamera(mouse, _camera);
    const intersects = raycaster.intersectObjects(_scene.children, true);

    for (const { object, point } of intersects) {
      let it = object;
      while (it) {
        if (it.calculateTilePosition) {
          const [ x, y ] = it.calculateTilePosition(point.x, point.z);
          this.handleTileClicked(x, y, left, { x: evt.x, y: evt.y });
          return;
        }

        it = it.parent;
        if (it.type === 'Scene') {
          break;
        }
      }
    }
  }

  handleModeChange(evt) {
    this.setState({
      mode: evt.target.value
    });
  }

  handleTileTypeChange(evt) {
    this.setState({
      tileType: evt.target.value
    });
  }

  exportWorld() {
    const world = {
      map: this.state.map
    };

    const text = JSON.stringify(world, null, 2);
    const blob = new Blob([ text ], {type: "application/json"});
    const url = URL.createObjectURL(blob);

    const win = window.open(url, '_blank');
    if (win) {
      win.focus();
    }
  }

  render() {
    const {
      map, mainRef, mode, size, tileType, menuOpen, menuPosition, tile
    } = this.state;

    const selectedTile = (menuOpen && tile) ? map[tile.y][tile.x] : null;
    const disabledTileDecoration = (selectedTile && (selectedTile[0] === 2 || selectedTile[0] === 4));

    return (
      <Fragment>
        <main
          ref={this.updateMainRef}
          onMouseDown={mainRef ? this.handleMouseDown : null}
          onContextMenuCapture={this.handleContextMenu}
        >
          {mainRef && (
            <Simulation
              sceneRef={this._sceneRef}
              withCamera={mode === 'camera'}
              world={{ map }}
              container={mainRef}
            />
          )}
          <div
            className="menu"
            style={menuOpen ? { transform: `translate(${menuPosition.x}px, ${menuPosition.y}px)` } : { display: 'none' }}
          >
            <MenuButton label="Rotate Left" onClick={this.rotateLeft} />
            <MenuButton label="Rotate Right" onClick={this.rotateRight} />

            <hr />

            <MenuButton label="Decoration Trashcan" onClick={() => this.toggleDecoration('trashCan')} disabled={disabledTileDecoration} />
            <MenuButton label="Decoration Bench" onClick={() => this.toggleDecoration('bench')} disabled={disabledTileDecoration} />

            {selectedTile && selectedTile[0] == 5 && (
              <Fragment>
                <hr />

                <MenuButton label="House Standard" onClick={() => this.updateHouse('Simple')} />
                <MenuButton label="House Flat" onClick={() => this.updateHouse('Flat')} />
                <MenuButton label="House Double" onClick={() => this.updateHouse('Double')} />
                <MenuButton label="House Bungalow" onClick={() => this.updateHouse('Bungalow')} />
              </Fragment>
            )}
          </div>
        </main>
        <div className="toolbar">
          <h4>Toolbar</h4>

          <div>
            Size:
            <input type="number" onInput={this.handleGridSizeChange} value={size} />
          </div>

          <div>
            Mode:
            <fieldset>
              <div>
                <input type="radio" id="camera" name="mode" value="camera" onChange={this.handleModeChange} checked={mode === 'camera'} />
                <label for="camera">Camera</label>
              </div>
              <div>
                <input type="radio" id="tile" name="mode" value="tile" onChange={this.handleModeChange} checked={mode === 'tile'} />
                <label for="tile">Tile</label>
              </div>
            </fieldset>
          </div>

          <hr />

          <div>
            Tile Type:

            <fieldset>
              {Object.entries(types)
                .map(([ id, { name } ]) => (
                  <div>
                    <input
                      type="radio"
                      id={id}
                      name="tileType"
                      value={id}
                      disabled={mode !== 'tile'}
                      onChange={this.handleTileTypeChange}
                      checked={tileType === id}
                    />
                    <label for={id}>{name}</label>
                  </div>
                ))}
            </fieldset>
          </div>

          <hr />

          <button type="button" onClick={this.exportWorld}>
            Export World
          </button>
        </div>
      </Fragment>
    );
  }
}

function init() {
  const root = document.body;

  render(
    <Creator />,
    root
  );
}

window.addEventListener('load', (/* event */) => {
  init();
});

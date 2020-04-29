/** @jsx h */

// Must be the first import
import "preact/debug";

import { Raycaster, Vector2 } from 'three';

import { h, render, Component, Fragment, createRef } from 'preact';
import { Simulation } from '../components/Simulation';
import { TYPES } from "../components/src/grid_tiles";
import { RandomGen } from "../components/src/randomgen";
import { TileOptions } from "./TileOptions";
import { Option } from "./UiComponents";

const FILL_TILE = [ TYPES.PLAIN, 0, {} ];

class Creator extends Component {
  constructor(...args) {
    super(...args);

    this._sceneRef = createRef(null);
    this._fileRef = createRef(null);

    this._random = new RandomGen(4213);

    const startTile = [ ...FILL_TILE ];
    startTile[2] = { ...startTile[2], seed: this.drainSeedValue() };

    this.state = {
      mainRef: null,

      tile: null,

      size: 1,
      map: [
        [ startTile ]
      ]
    };

    this._mouseDown = null;

    this.handleGridSizeChange = this.handleGridSizeChange.bind(this);
    this.updateMainRef = this.updateMainRef.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleTileChange = this.handleTileChange.bind(this);

    this.exportWorld = this.exportWorld.bind(this);
    this.importWorld = this.importWorld.bind(this);
    this.handleWorldImportChange = this.handleWorldImportChange.bind(this);
  }

  drainSeedValue() {
    return this._random.integer(0, 100000);
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
            return [
              ...row,
              ...new Array(diff)
                .fill(FILL_TILE)
                .map(([ t, r, o ]) => ([ t, r, { ...o, seed: this.drainSeedValue() } ]))
            ];
          } else {
            return row.slice(0, newSize);
          }
        })
        .filter((r, idx) => idx < newSize)
        .concat(
          new Array(Math.max(0, diff))
            .fill(
              new Array(newSize)
                .fill(FILL_TILE)
                .map(([ t, r, o ]) => ([ t, r, { ...o, seed: this.drainSeedValue() } ]))
            )
        );

      return {
        map: newMap,
        size: newSize
      };
    });
  }

  handleTileChange(tileUpdated) {
    this.setState(
      ({ map, tile: selectedTile }) => ({
        map: map
          .map((row, y) => (
            y === selectedTile.y
              ? row
                .map((t, x) => selectedTile.x === x ? tileUpdated : t)
              : row
          ))
      })
    );
  }

  handleClick(evt) {
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
          this.setState({
            tile: { x, y }
          });
          return;
        }

        it = it.parent;
        if (it.type === 'Scene') {
          break;
        }
      }
    }
  }

  handleMouseDown(evt) {
    if (evt.button != 0) {
      return;
    }

    this._mouseDown = {
      x: evt.x,
      y: evt.y,
      time: new Date().getTime()
    };
  }

  handleMouseUp(evt) {
    if (evt.button != 0) {
      return;
    }

    if (!this._mouseDown) {
      return;
    }

    const { time, x, y } = this._mouseDown;

    const now = new Date().getTime();
    const distance = Math.sqrt(Math.pow(evt.x - x) + Math.pow(evt.y - y));

    if (distance > 5 || now - time > 300) {
      return;
    }

    this.handleClick(evt);
  }

  importWorld() {
    const e = this._fileRef.current;
    if (!e) {
      return;
    }

    e.click();
  }

  handleWorldImportChange(evt) {
    if (!evt.target.files || evt.target.files.length !== 1) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;

      try {
        const { map, cars } = JSON.parse(text);

        this.setState({ map, cars, tile: null });
      } catch (ex) {
        console.error(ex);
        alert('File could not be read');
      } finally {
        evt.target.value = '';
      }
    };
    reader.readAsText(evt.target.files[0]);
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
      map, mainRef, size, tile
    } = this.state;

    const selectedTile = tile ? map[tile.y][tile.x] : null;

    return (
      <Fragment>
        <main
          ref={this.updateMainRef}
          onMouseDown={mainRef ? this.handleMouseDown : null}
          onMouseUp={mainRef ? this.handleMouseUp : null}
        >
          {mainRef && (
            <Simulation
              sceneRef={this._sceneRef}
              withCamera
              creatorView
              world={{ map }}
              container={mainRef}
              highlightTile={tile}
            />
          )}
        </main>
        <div className="toolbar">
          <div className="object-panel">
            <div>
              <Option>
                <h4>Grid</h4>
              </Option>

              <Option
                label="Grid Size"
              >
                <input type="number" onInput={this.handleGridSizeChange} value={size} />
              </Option>
            </div>

            <hr />

            <div>
              <Option>
                {selectedTile && (
                  <h4>
                    Tile: x = {tile.x}, y = {tile.y}
                  </h4>
                )}
              </Option>

              {selectedTile && (
                <TileOptions
                  onChange={this.handleTileChange}
                  tile={selectedTile}
                />
              )}
            </div>
          </div>

          <div className="import-export">
            <input
              type="file"
              hidden
              ref={this._fileRef}
              onChange={this.handleWorldImportChange}
              accept="application/json"
            />
            <button type="button" onClick={this.importWorld}>
              Import World
            </button>
            <button type="button" onClick={this.exportWorld}>
              Export World
            </button>
          </div>
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

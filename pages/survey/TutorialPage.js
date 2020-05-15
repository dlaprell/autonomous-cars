// @ts-check

/** @jsx h */

import { h, Component } from 'preact';
import { Content, Button, ButtonBar } from './Ui';
import AspectRatioKeeper from './AspectRatioKeeper';
import { Simulation } from '../../components/Simulation';

import * as world from '../../situations/standard_practice.json';
import { GridMap } from '../../components/src/grid';

import RunResult from './RunResult';

const UI_STATE = {
  RUN: 'run',
  RESULT: 'result',
  READY: 'ready'
};

export default class TutorialPage extends Component {
  constructor(...args) {
    super(...args);

    this.state = {
      fullRunAtLeastOnce: false,

      worldKey: 0,

      uiState: UI_STATE.RUN
    };

    this.handleReady = (evt) => {
      evt.preventDefault();

      const { onReady } = this.props;
      if (onReady) {
        onReady();
      }
    }

    this.grid = new GridMap(
      this.props.models,
      {
        baseMap: world.map,
        creatorView: false,
        asyncInit: false
      }
    );

    this.handleSimulationStop = () => {
      this.setState({
        fullRunAtLeastOnce: true,
        uiState: UI_STATE.RESULT
      });
    };

    this.handleRepeat = () => {
      this.setState(st => ({
        worldKey: st.worldKey + 1,
        uiState: UI_STATE.RUN
      }));
    };

    this.handleResult = () => {
      this.setState({
        uiState: UI_STATE.READY
      })
    }
  }

  render() {
    const { footer, models, duration } = this.props;
    const { fullRunAtLeastOnce, uiState, worldKey } = this.state;

    return (
      <Content footer={footer}>
        <div className="root">
          <div className="top-spacer" />

          <h3>
            Übungsdurchlauf
          </h3>

          <div className="top-spacer" />

          {uiState === UI_STATE.RUN && (
            <AspectRatioKeeper minRatio={4 / 3} maxRatio={16 / 9}>
              <Simulation
                key={`world_${worldKey}`}
                withTraffic
                world={world}
                preLoadedGrid={this.grid}
                stopAfter={Math.min(duration, 20000)}
                models={models}
                onStop={this.handleSimulationStop}
              />
            </AspectRatioKeeper>
          )}

          {uiState == UI_STATE.RESULT && (
            <RunResult
              onResult={this.handleResult}
              footer={null}
              buttonText="Weiter"
            />
          )}

          {uiState == UI_STATE.READY && (
            <p>
              Das Tutorial ist nun beendet. Klicken Sie auf "Zur ersten Szene" um
              die erste Szene aus der Studie zu sehen. Um das Tutorial nocheinmal zu
              sehen klicken Sie bitte auf "Testszene wiederholen".
            </p>
          )}

          <div className="top-spacer" />

          <ButtonBar align="center">
            <Button onClick={this.handleRepeat} disabled={uiState == UI_STATE.RUN}>
              Testszene wiederholen
            </Button>
            <Button onClick={this.handleReady} disabled={!fullRunAtLeastOnce}>
              Zur ersten Szene
            </Button>
          </ButtonBar>
        </div>

        <style jsx>{`
          div.root {
            display: flex;
            flex-direction: column;
            min-height: 100%;
            padding: 8px;
          }

          .top-spacer {
            flex: 1;
            max-height: 64px;
          }
        `}</style>
      </Content>
    );
  }
}
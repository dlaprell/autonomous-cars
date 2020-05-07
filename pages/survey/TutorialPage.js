// @ts-check

/** @jsx h */

import { h, Component } from 'preact';
import { Content, Button, ButtonBar } from './Ui';

export default class TutorialPage extends Component {
  constructor(...args) {
    super(...args);

    this.handleClick = (evt) => {
      evt.preventDefault();

      const { onStart } = this.props;
      if (onStart) {
        onStart({});
      }
    }
  }

  render() {
    const { footer } = this.props;

    return (
      <Content footer={footer}>
        <div className="root">
          <div className="top-spacer" />

          <h3>
            Notes
          </h3>

          <div className="top-spacer" />

          <p>
            Lorem ipsum dolor sit amet, consetetur sadipscing elitr,
            sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat,
            sed diam voluptua. At vero eos et accusam et justo duo dolores et ea
            rebum. Stet clita kasd gubergren, no sea takimata sanctus est
            Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur
            sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et
            dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et
            justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea
            takimata sanctus est Lorem ipsum dolor sit amet.
          </p>

          <ButtonBar align="center">
            <Button onClick={this.handleClick}>
              First Situation
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
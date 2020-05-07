// @ts-check

/** @jsx h */

import { h, Component } from 'preact';
import { Content, Button, ButtonBar } from './Ui';

export default class TutorialPage extends Component {
  constructor(...args) {
    super(...args);

    this.handleClick = (evt) => {
      evt.preventDefault();

      alert('Ups. This is an alpha version - remember? ;-D');
    }
  }

  render() {
    const { footer, results } = this.props;

    return (
      <Content footer={footer}>
        <div className="root">
          <div className="top-spacer" />

          <h3>
            Finished!
          </h3>

          <div className="top-spacer" />

          <pre>
            {JSON.stringify(results, null, 2)}
          </pre>

          <ButtonBar align="center">
            <Button onClick={this.handleClick}>
              Submit Results
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
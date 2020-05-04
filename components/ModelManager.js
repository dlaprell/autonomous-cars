// @ts-check
/** @jsx h */

import { h, Component, createContext } from 'preact';

const ModelContext = createContext(null);

class ModelManager extends Component {
  render() {
    const { models, children } = this.props;

    return (
      <ModelContext.Provider value={models}>
        {children}
      </ModelContext.Provider>
    );
  }
}

function ModelConsumer({ component, ...props }) {
  return (
    <ModelContext.Consumer>
      {models => h(component, { models, ...props })}
    </ModelContext.Consumer>
  );
}

export {
  ModelContext,

  ModelManager,
  ModelConsumer
};

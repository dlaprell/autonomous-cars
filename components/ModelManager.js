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

const ModelConsumer = ModelContext.Consumer;

export {
  ModelManager,
  ModelConsumer
};

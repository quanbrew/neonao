import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './index.scss';
import { connect, Provider } from 'react-redux';
import { store } from './store';
import { Dispatch } from 'redux';
import { redo, undo } from './actions';
import { isRedoKey, isUndoKey } from './keyboard';
import 'normalize.css';

const List = React.lazy(() =>
  import(/* webpackChunkName: "list_component" */
  './List/List')
);

interface Props {
  undo: () => void;
  redo: () => void;
}

const mapStateToProps = (): {} => ({});

const mapDispatchToProps = (dispatch: Dispatch): Pick<Props, 'undo' | 'redo'> => {
  const performUndo = () => dispatch(undo);
  const performRedo = () => dispatch(redo);
  return { undo: performUndo, redo: performRedo };
};

const App = ({ redo, undo }: Props) => (
  <div>
    <header>
      <a className="app-name" href="/">
        NeoNao
      </a>
    </header>
    <button onClick={undo} id="undo">
      UNDO
    </button>
    <button onClick={redo} id="redo">
      REDO
    </button>
    <React.Suspense fallback={<div>Loading Module...</div>}>
      <List />
    </React.Suspense>
  </div>
);

const AppContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(App);

ReactDOM.render(
  <Provider store={store}>
    <AppContainer />
  </Provider>,
  document.getElementById('root') as HTMLElement
);

document.onkeydown = e => {
  const undoButton = document.getElementById('undo') as HTMLButtonElement;
  const redoButton = document.getElementById('redo') as HTMLButtonElement;

  const click = (button: HTMLButtonElement) => {
    button.click();
  };

  if (isUndoKey(e)) {
    click(undoButton);
  } else if (isRedoKey(e)) {
    click(redoButton);
  }
};

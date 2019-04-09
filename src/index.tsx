import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './index.css';
import { connect, Provider } from 'react-redux';
import { store } from './store';
import { Dispatch } from 'redux';
import { redo, undo } from './actions';
import { isRedoKey, isUndoKey } from './keyboard';

import(/* webpackChunkName: "react_dnd" */
/* webpackPrefetch: true */
/* webpackPreload: true */
'react-dnd');
import(/* webpackChunkName: "dnd_backend" */
/* webpackPrefetch: true */
/* webpackPreload: true */
'react-dnd-html5-backend');
const List = React.lazy(() =>
  import(/* webpackChunkName: "list_component" */
  /* webpackPrefetch: true */
  /* webpackPreload: true */
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

class App extends React.Component<Props> {
  render() {
    return (
      <div>
        <header>
          <a className="app-name" href="/">
            NeoNao
          </a>
        </header>
        <button onClick={this.props.undo} id="undo">
          UNDO
        </button>
        <button onClick={this.props.redo} id="redo">
          REDO
        </button>
        <React.Suspense fallback={<div>Loading...</div>}>
          <List />
        </React.Suspense>
      </div>
    );
  }
}

const main = async () => {
  const { DragDropContext } = await import('react-dnd');
  const HTML5Backend = await import('react-dnd-html5-backend');
  const applyDragDrop = DragDropContext(HTML5Backend.default)(App);
  const ConnectedApp = connect(
    mapStateToProps,
    mapDispatchToProps
  )(applyDragDrop);

  ReactDOM.render(
    <Provider store={store}>
      <ConnectedApp />
    </Provider>,
    document.getElementById('root') as HTMLElement
  );
};

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

main().then(() => {});

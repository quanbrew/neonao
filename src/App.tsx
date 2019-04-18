import * as React from 'react';
import { useEffect, useReducer } from 'react';
import List from './List';
import { initState } from './state';
import { reducer } from './reducers/state';
import { isRedoKey, isSaveKey, isUndoKey } from './keyboard';
import { Action, redo, undo } from './actions';
import './App.scss';
import { loadTree, Tree } from './tree';

export type Dispatch = React.Dispatch<Action>;

const useHotKey = (dispatch: Dispatch) => {
  useEffect(() => {
    const keyListener = (e: KeyboardEvent) => {
      if (isRedoKey(e) || isUndoKey(e) || isSaveKey(e)) {
        e.stopPropagation();
        e.preventDefault();
        if (isRedoKey(e)) {
          dispatch(redo);
        } else if (isUndoKey(e)) {
          dispatch(undo);
        }
      }
    };
    document.addEventListener('keydown', keyListener, true);
    return () => document.removeEventListener('keydown', keyListener, true);
  }, []);
};

export const useInit = (dispatch: Dispatch, tree: Tree | null) => {
  useEffect(() => {
    if (tree === null) {
      loadTree().then(dispatch);
    }
  });
};

export const App = () => {
  const [state, dispatch] = useReducer(reducer, initState);
  const { tree } = state;
  useInit(dispatch, tree);
  useHotKey(dispatch);
  if (!tree) {
    return <p>Loading Tree...</p>;
  }

  const lists = state.views.map(view => (
    <List
      key={view.id}
      view={view}
      tree={tree}
      mode={state.mode}
      dispatch={dispatch}
      emptyFuture={state.future.size === 0}
      emptyHistory={state.history.size === 0}
    />
  ));
  return <div className="App">{lists}</div>;
};

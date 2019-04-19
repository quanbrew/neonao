import * as React from 'react';
import { useEffect, useReducer } from 'react';
import List from './List';
import { loadState, State } from './state';
import { reducer } from './reducers/state';
import { isRedoKey, isSaveKey, isUndoKey } from './keyboard';
import { Action, loadedState, redo, undo } from './actions';
import './App.scss';

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

export const useInit = (dispatch: Dispatch, state: State | null) => {
  useEffect(() => {
    if (state === null) {
      loadState().then(state => dispatch(loadedState(state)));
    }
  }, [state]);
};

export const App = () => {
  const [state, dispatch] = useReducer(reducer, null);
  useInit(dispatch, state);
  useHotKey(dispatch);
  if (!state) {
    return <p>Loading Tree...</p>;
  }
  const { tree } = state;

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

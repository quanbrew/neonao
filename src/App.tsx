import * as React from 'react';
import { useEffect, useReducer } from 'react';
import List from './List';
import { createView, loadState, State } from './state';
import { reducer } from './reducers/state';
import { isRedoKey, isSaveKey, isUndoKey } from './keyboard';
import { Action, addView, loadedState, redo, undo } from './actions';
import './App.scss';
import { UndoIcon } from './icons/UndoIcon';
import { RedoIcon } from './icons/RedoIcon';
import { PlusIcon } from './icons/PlusIcon';

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

  const handleUndo = () => dispatch(undo);
  const handleRedo = () => dispatch(redo);
  const handleCreateView = () => dispatch(addView(createView(tree.root)));
  const lists = state.views.map(view => (
    <List key={view.id} view={view} tree={tree} mode={state.mode} dispatch={dispatch} />
  ));
  return (
    <div className="App">
      <div className="toolbar">
        <button className="icon undo" onClick={handleUndo} disabled={state.history.size === 0}>
          <UndoIcon />
        </button>
        <button className="icon redo" onClick={handleRedo} disabled={state.future.size === 0}>
          <RedoIcon />
        </button>
        <button className="icon create-view" onClick={handleCreateView}>
          <PlusIcon />
        </button>
      </div>
      <div className="lists">{lists}</div>
    </div>
  );
};

import * as React from 'react';
import { useEffect, useReducer, useState } from 'react';
import List from './List';
import { initState } from './state';
import { reducer } from './reducers/state';
import { isRedoKey, isSaveKey, isUndoKey } from './keyboard';
import { Action, redo, undo } from './actions';
import { getIdInPath } from './path';
import './App.scss';

export type Dispatch = React.Dispatch<Action>;

const useGlobalKey = (dispatch: Dispatch) => {
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

interface PageChange {
  time: number;
  location: Location;
}

const makePageChange = (): PageChange => {
  const time = Date.now();
  const location = window.location;
  return { time, location };
};

const usePageChange = (callback?: () => void): PageChange => {
  const [pageChange, setPageChange] = useState(makePageChange());

  const historyListener = () => {
    setPageChange(makePageChange());
    if (callback) {
      callback();
    }
  };

  useEffect(() => {
    window.addEventListener('popstate', historyListener);
    return () => window.removeEventListener('popstate', historyListener);
  }, []);
  return pageChange;
};

export const App = () => {
  const [state, dispatch] = useReducer(reducer, initState);
  const pageChange = usePageChange();
  const idInPath = getIdInPath(pageChange.location.pathname);
  useGlobalKey(dispatch);
  const startId = idInPath || (state.tree && state.tree.root);
  return (
    <div className="App">
      <List
        tree={state.tree}
        mode={state.mode}
        dispatch={dispatch}
        startId={startId}
        pageStartTime={pageChange.time}
        emptyFuture={state.future.size === 0}
        emptyHistory={state.history.size === 0}
      />
    </div>
  );
};

import * as React from 'react';
import { useEffect, useReducer, useState } from 'react';
import List from './List';
import { initListState, listReducer } from './reducers/list';
import { isRedoKey, isSaveKey, isUndoKey } from './keyboard';
import { ListAction, redo, undo } from './actions';
import { getIdInPath } from './path';

export type Dispatch = React.Dispatch<ListAction>;

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
  const [listState, dispatch] = useReducer(listReducer, initListState);
  const pageChange = usePageChange();
  const idInPath = getIdInPath(pageChange.location.pathname);
  useGlobalKey(dispatch);
  const startId = idInPath || (listState.tree && listState.tree.root);
  return (
    <div>
      <header>
        <a className="app-name" href="/">
          NeoNao
        </a>
      </header>
      <List
        tree={listState.tree}
        dispatch={dispatch}
        startId={startId}
        pageStartTime={pageChange.time}
        emptyFuture={listState.future.size === 0}
        emptyHistory={listState.history.size === 0}
      />
    </div>
  );
};

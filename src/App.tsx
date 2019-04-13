import * as React from 'react';
import { useEffect, useReducer } from 'react';
import List from './List/List';
import { initListState, listReducer } from './List/reducers';
import { isRedoKey, isSaveKey, isUndoKey } from './keyboard';
import { ListAction, redo, undo } from './actions';

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

export const App = () => {
  const [listState, dispatch] = useReducer(listReducer, initListState);
  useGlobalKey(dispatch);
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
        emptyFuture={listState.future.size === 0}
        emptyHistory={listState.history.size === 0}
      />
    </div>
  );
};

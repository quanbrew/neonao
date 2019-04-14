import * as React from 'react';
import { useEffect, useReducer } from 'react';
import List from './List';
import { initListState, listReducer } from './reducers';
import { isRedoKey, isSaveKey, isUndoKey } from './keyboard';
import { ListAction, redo, startLoad, undo } from './actions';
import { loadListState, Tree } from './tree';

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

const useLoadTree = (dispatch: Dispatch, tree: Tree | null) => {
  useEffect(() => {
    if (tree === null) {
      dispatch(startLoad());
      loadListState(3).then(dispatch);
    }
  }, [tree]);
};

export const App = () => {
  const [listState, dispatch] = useReducer(listReducer, initListState);
  useGlobalKey(dispatch);
  useLoadTree(dispatch, listState.tree);
  let list;
  if (listState.tree) {
    list = (
      <List
        tree={listState.tree}
        dispatch={dispatch}
        emptyFuture={listState.future.size === 0}
        emptyHistory={listState.history.size === 0}
      />
    );
  } else {
    list = <div>Loading Tree...</div>;
  }
  return (
    <div>
      <header>
        <a className="app-name" href="/">
          NeoNao
        </a>
      </header>
      {list}
    </div>
  );
};

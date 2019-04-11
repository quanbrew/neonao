import * as React from 'react';
import { useContext, useReducer, useRef } from 'react';
import Root from './Root';
import { getItem, Tree } from '../tree';
import { ListAction, redo, undo } from '../actions';
import { initListState, listReducer } from './reducers';
import { isRedoKey, isUndoKey } from '../keyboard';

export const TreeContext: React.Context<Tree | null> = React.createContext(null);
export type Dispatch = React.Dispatch<ListAction>;
export const DispatchContext: React.Context<Dispatch> = React.createContext(() => {
  throw Error('uninitiated dispatcher');
});

export const useDispatch = (): Dispatch => {
  return useContext(DispatchContext);
};

export const useTree = (): Tree => {
  const tree = useContext(TreeContext);
  if (tree === null) {
    throw Error('access tree before loaded');
  }
  return tree;
};

export const List = React.memo(() => {
  const [listState, dispatch] = useReducer(listReducer, initListState);
  const { tree } = listState;
  const root = tree ? getItem(tree.map, tree.root) : null;
  const undoRef = useRef<HTMLButtonElement>(null);
  const redoRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown: React.KeyboardEventHandler = e => {
    if (isUndoKey(e)) {
      e.stopPropagation();
      e.preventDefault();
      if (undoRef.current) undoRef.current.click();
    } else if (isRedoKey(e)) {
      e.stopPropagation();
      e.preventDefault();
      if (redoRef.current) redoRef.current.click();
    }
  };
  const handleUndo = () => dispatch(undo);
  const handleRedo = () => dispatch(redo);
  return (
    <div onKeyDownCapture={handleKeyDown}>
      <button ref={undoRef} onClick={handleUndo}>
        UNDO
      </button>
      <button ref={redoRef} onClick={handleRedo}>
        REDO
      </button>
      <DispatchContext.Provider value={dispatch}>
        <TreeContext.Provider value={tree}>
          <Root root={root} />
        </TreeContext.Provider>
      </DispatchContext.Provider>
    </div>
  );
});

export default List;

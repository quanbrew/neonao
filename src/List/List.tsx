import * as React from 'react';
import { useContext } from 'react';
import Root from './Root';
import { getItem, Tree } from '../tree';
import { ListAction, redo, undo } from '../actions';

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

interface Props {
  tree: Tree | null;
  dispatch: Dispatch;
  emptyFuture: boolean;
  emptyHistory: boolean;
}

export const List = React.memo(({ tree, dispatch, emptyFuture, emptyHistory }: Props) => {
  const root = tree ? getItem(tree.map, tree.root) : null;

  const handleUndo = () => dispatch(undo);
  const handleRedo = () => dispatch(redo);
  return (
    <div>
      <button id="undo" onClick={handleUndo} disabled={emptyHistory}>
        UNDO
      </button>
      <button id="redo" onClick={handleRedo} disabled={emptyFuture}>
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

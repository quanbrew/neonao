import * as React from 'react';
import { useContext, useEffect, useReducer, useRef } from 'react';
import Root from './Root';
import { getItem, loadTree, patchTree, pathInMap, Tree } from '../tree';
import { redo, undo, ViewAction, zoom } from '../actions';
import { Breadcrumb } from './Breadcrumb';
import { Dispatch } from '../App';
import { createView, viewReducer } from '../reducers/view';
import { Id, Item } from '../Item';
import { UndoIcon } from '../icons/UndoIcon';
import './List.scss';
import { RedoIcon } from '../icons/RedoIcon';

export const TreeContext: React.Context<Tree | null> = React.createContext(null);
export const DispatchContext: React.Context<Dispatch> = React.createContext(() => {
  throw Error('uninitiated dispatcher');
});

export type ViewDispatch = React.Dispatch<ViewAction>;
export const ViewDispatchContext: React.Context<ViewDispatch> = React.createContext(() => {
  throw Error('uninitiated dispatcher');
});

export const useDispatch = (): Dispatch => {
  return useContext(DispatchContext);
};

export const useViewDispatch = (): ViewDispatch => {
  return useContext(ViewDispatchContext);
};

export const useTree = (): Tree => {
  const tree = useContext(TreeContext);
  if (tree === null) {
    throw Error('access tree before loaded');
  }
  return tree;
};

const useRoot = (dispatch: Dispatch, tree: Tree | null, from: Id | null): Item | null => {
  useEffect(() => {
    if (tree) {
      patchTree(tree.map, from || tree.root).then(dispatch);
    } else {
      loadTree(from).then(dispatch);
    }
  }, [from]);
  if (!tree || !pathInMap(tree.map, from || tree.root)) {
    return null;
  } else {
    return getItem(tree.map, from || tree.root);
  }
};

interface Props {
  tree: Tree | null;
  dispatch: Dispatch;
  startId: Id | null;
  pageStartTime: number;
  emptyFuture: boolean;
  emptyHistory: boolean;
}

const Loading = () => {
  return <p>Tree Loading...</p>;
};

export const List = ({ tree, dispatch, emptyFuture, emptyHistory, startId, pageStartTime }: Props) => {
  const prevTime = useRef(pageStartTime);
  const [viewState, viewDispatch] = useReducer(viewReducer, createView(startId));
  const root = useRoot(dispatch, tree, viewState.root);

  if (!root || !tree) {
    return <Loading />;
  }

  if (prevTime.current !== pageStartTime) {
    viewDispatch(zoom(startId, false));
    prevTime.current = pageStartTime;
  }

  const handleUndo = () => dispatch(undo);
  const handleRedo = () => dispatch(redo);
  return (
    <ViewDispatchContext.Provider value={viewDispatch}>
      <div className="List">
        <Breadcrumb id={root.id} map={tree.map} />
        <div className="toolbar">
          <button className="undo" onClick={handleUndo} disabled={emptyHistory}>
            <UndoIcon />
          </button>
          <button className="redo" onClick={handleRedo} disabled={emptyFuture}>
            <RedoIcon />
          </button>
        </div>
        <DispatchContext.Provider value={dispatch}>
          <TreeContext.Provider value={tree}>
            <Root root={root} mode={tree.mode} />
          </TreeContext.Provider>
        </DispatchContext.Provider>
      </div>
    </ViewDispatchContext.Provider>
  );
};

import * as React from 'react';
import { useContext, useReducer, useRef } from 'react';
import Root from './Root';
import { getItem, Tree } from '../tree';
import { redo, undo, ViewAction, zoom } from '../actions';
import { Breadcrumb } from './Breadcrumb';
import { Dispatch } from '../App';
import { createView, viewReducer } from '../reducers/view';
import { Id } from '../Item';

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

interface Props {
  tree: Tree;
  dispatch: Dispatch;
  startId: Id;
  pageStartTime: number;
  emptyFuture: boolean;
  emptyHistory: boolean;
}

export const List = ({ tree, dispatch, emptyFuture, emptyHistory, startId, pageStartTime }: Props) => {
  const prevTime = useRef(pageStartTime);
  const [viewState, viewDispatch] = useReducer(viewReducer, createView(startId));
  if (prevTime.current !== pageStartTime) {
    viewDispatch(zoom(startId, false));
    prevTime.current = pageStartTime;
  }

  const root = getItem(tree.map, viewState.root);

  const handleUndo = () => dispatch(undo);
  const handleRedo = () => dispatch(redo);
  return (
    <div>
      <Breadcrumb id={root.id} map={tree.map} dispatch={viewDispatch} />
      <button id="undo" onClick={handleUndo} disabled={emptyHistory}>
        UNDO
      </button>
      <button id="redo" onClick={handleRedo} disabled={emptyFuture}>
        REDO
      </button>
      <DispatchContext.Provider value={dispatch}>
        <ViewDispatchContext.Provider value={viewDispatch}>
          <TreeContext.Provider value={tree}>
            <Root root={root} />
          </TreeContext.Provider>
        </ViewDispatchContext.Provider>
      </DispatchContext.Provider>
    </div>
  );
};

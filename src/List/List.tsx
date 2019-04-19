import * as React from 'react';
import { useContext, useEffect, useState } from 'react';
import Root from './Root';
import { getItem, patchTree, pathInMap, Tree } from '../tree';
import { Breadcrumb } from './Breadcrumb';
import { Dispatch } from '../App';
import { Id, Item } from '../Item';
import './List.scss';
import { Mode, normalMode, View } from '../state';

export const TreeContext: React.Context<Tree | null> = React.createContext(null);

export const useTree = (): Tree => {
  const tree = useContext(TreeContext);
  if (tree === null) {
    throw Error('access the tree before it loaded');
  }
  return tree;
};

export const DispatchContext: React.Context<Dispatch> = React.createContext(() => {
  throw Error('uninitiated dispatcher');
});

export const useDispatch = (): Dispatch => {
  return useContext(DispatchContext);
};

const ModeContext: React.Context<Mode> = React.createContext(normalMode());

export const useMode = (): Mode => useContext(ModeContext);

const ViewContext: React.Context<View | null> = React.createContext(null);

export const useView = (): View => {
  const view = useContext(ViewContext);
  if (!view) {
    throw Error('uninitiated view');
  }
  return view;
};

const NOT_FOUND = 'NOT_FOUND';
const LOADING = 'LOADING';
type LoadState = typeof LOADING | typeof NOT_FOUND;

const useRoot = (dispatch: Dispatch, tree: Tree, from: Id): Item | LoadState => {
  const [loadState, setLoadState] = useState<LoadState>(LOADING);
  useEffect(() => {
    patchTree(tree.map, from || tree.root)
      .then(dispatch)
      .catch(() => {
        setLoadState(NOT_FOUND);
      });
  }, [from]);
  if (!pathInMap(tree.map, from)) {
    return loadState;
  } else {
    return getItem(tree.map, from || tree.root);
  }
};

interface Props {
  tree: Tree;
  view: View;
  mode: Mode;
  dispatch: Dispatch;
}

export const List = ({ tree, mode, view, dispatch }: Props) => {
  const root = useRoot(dispatch, tree, view.root);

  if (root === NOT_FOUND) {
    return <h1>404</h1>;
  } else if (root === LOADING) {
    return <h1>Node Loading...</h1>;
  }

  return (
    <DispatchContext.Provider value={dispatch}>
      <ViewContext.Provider value={view}>
        <ModeContext.Provider value={mode}>
          <TreeContext.Provider value={tree}>
            <div className="List">
              <Breadcrumb id={root.id} map={tree.map} />
              <Root realRoot={tree.root} root={root} mode={mode} />
            </div>
          </TreeContext.Provider>
        </ModeContext.Provider>
      </ViewContext.Provider>
    </DispatchContext.Provider>
  );
};

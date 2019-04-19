import { List } from 'immutable';
import { createEmptyTree, loadTree, Tree } from './tree';
import { DETAIL_MODE, DRAG_MODE, EDIT_MODE, NORMAL_MODE, SELECT_MODE } from './constants';
import { Id } from './Item';

const uuid1 = require('uuid/v1');

export type Mode = EditMode | SelectMode | DetailMode | DragMode | NormalMode;

export interface NormalMode {
  type: typeof NORMAL_MODE;
}

export const normalMode = (): NormalMode => ({ type: NORMAL_MODE });

export type DropPosition = 'above' | 'below' | 'inner';

export interface DragMode {
  type: typeof DRAG_MODE;
}

export const dragMode = (): DragMode => ({
  type: DRAG_MODE,
});

export interface EditMode {
  type: typeof EDIT_MODE;
  id: Id;
}

export const editMode = (id: Id): EditMode => ({
  type: EDIT_MODE,
  id,
});

export interface SelectMode {
  type: typeof SELECT_MODE;
  selected: Id[];
  cut: boolean;
}

export interface DetailMode {
  type: typeof DETAIL_MODE;
  id: Id;
}

export type ViewId = string;

export interface View {
  id: ViewId;
  root: Id;
}

export const createView = (root: Id): View => {
  const id = uuid1();
  return { id, root };
};

export type ViewList = List<View>;

export interface State {
  tree: Tree;
  history: List<Tree>;
  future: List<Tree>;
  mode: Mode;
  views: ViewList;
}

export const createEmptyState = (): State => {
  const tree = createEmptyTree();
  const view = createView(tree.root);
  const mode = normalMode();
  const future = List();
  const history = List();
  const views = List([view]);
  return { tree, views, mode, future, history };
};

export const loadState = async (): Promise<State> => {
  const tree = await loadTree();
  const views = List([createView(tree.root)]);
  return { ...createEmptyState(), tree, views };
};

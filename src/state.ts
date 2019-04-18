import { List, Map } from 'immutable';
import { Tree } from './tree';
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
  order?: number;
}

export const createView = (root: Id, order?: number): View => {
  const id = uuid1();
  return { id, root, order };
};

export type ViewMap = Map<ViewId, View>;

export interface State {
  tree: Tree | null;
  history: List<Tree>;
  future: List<Tree>;
  mode: Mode;
  views: ViewMap;
}

export const initState: State = {
  tree: null,
  history: List(),
  future: List(),
  mode: normalMode(),
  views: Map(),
};

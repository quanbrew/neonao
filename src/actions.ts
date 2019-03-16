import { ID, Item } from "./Item";
import { Mode, Tree } from "./tree"
import { EditorState } from "draft-js";
import {
  ADD_INDENT,
  APPLY_DROP,
  CREATE,
  EDIT,
  EXPAND,
  FETCH_ALL,
  FOLD,
  LOADED_STATE,
  MOVE_INTO,
  MOVE_NEAR,
  REDO,
  REMOVE,
  SWITCH_MODE,
  UNDO,
  UPDATE,
  ZOOM,
} from "./constants";


export type ItemAction =
  | Fold
  | Expand
  | FetchAll
  | Zoom
  | Create
  | Update
  | Edit
  | Remove
  | LoadedState
  | Undo
  | Redo
  | MoveInto
  | MoveNear
  | AddIndent
  | SwitchMode
  | ApplyDrop


export interface FetchAll {
  type: typeof FETCH_ALL,
}


export const fetchAll = (): FetchAll => ({ type: FETCH_ALL });


export interface Remove {
  type: typeof REMOVE,
  id: ID,
}


export const remove = (id: ID): Remove => ({ type: REMOVE, id });


export interface Update {
  type: typeof UPDATE;
  item: Item;
  record: boolean;
}

export const update = (item: Item, record: boolean = false): Update => ({ type: UPDATE, item, record });


export interface Edit {
  type: typeof EDIT;
  id: ID;
  editor: EditorState;
}

export const edit = (id: ID, editor: EditorState): Edit => (
  { type: EDIT, id, editor }
);


export interface Create {
  type: typeof CREATE;
  item: Item;
  order?: number;
}

export const create = (item: Item, order?: number): Create => (
  { type: CREATE, item, order }
);


export interface Zoom {
  type: typeof ZOOM,
  id: ID,
}


export const zoom = (id: ID): Zoom => ({ type: ZOOM, id });


export interface Expand {
  type: typeof EXPAND,
  id: ID,
}


export const expand = (id: ID): Expand => ({ type: EXPAND, id });


export interface Fold {
  type: typeof FOLD,
  id: ID,
}


export const fold = (id: ID): Fold => ({ type: FOLD, id });


export interface MoveInto {
  type: typeof MOVE_INTO;
  id: ID;
  parent: ID;
  nextParent: ID;
  order: number | 'append';
  relative: boolean;
}


export type Order = number | 'append';
export const moveInto = (id: ID, parent: ID, nextParent: ID, order: Order, relative?: boolean): MoveInto => (
  { type: MOVE_INTO, id, parent, order, nextParent, relative: relative === true }
);


export const relativeMove = (id: ID, parent: ID, order: number | 'append'): MoveInto => (
  { type: MOVE_INTO, id, parent, order, nextParent: parent, relative: true }
);


export interface MoveNear {
  type: typeof MOVE_NEAR;
  id: ID;
  parent: ID;
  sibling: ID;
  offset: number;
}


export const moveNear = (id: ID, parent: ID, sibling: ID, offset: number): MoveNear => (
  { type: MOVE_NEAR, id, sibling, parent, offset }
);


// as child, append to previous item.
export interface AddIndent {
  type: typeof ADD_INDENT;
  id: ID;
  parent: ID;
}


export const addIndent = (id: ID, parent: ID): AddIndent => (
  { type: ADD_INDENT, id, parent }
);


export interface Undo {
  type: typeof UNDO;
}

export const undo: Undo = { type: UNDO };

export interface Redo {
  type: typeof REDO;
}

export const redo: Redo = { type: REDO };

export interface LoadedState {
  type: typeof LOADED_STATE;
  state: Partial<Tree>;
}


export const loadedState = (state: Partial<Tree>): LoadedState => (
  { type: LOADED_STATE, state }
);

export interface SwitchMode {
  type: typeof SWITCH_MODE;
  mode: Mode;
}

export const switchMode = (mode: Mode): SwitchMode => ({ type: SWITCH_MODE, mode });


export interface ApplyDrop {
  type: typeof APPLY_DROP;
  id: ID;
  parent: ID;
}

export const applyDrop = (id: ID, parent: ID): ApplyDrop => ({ type: APPLY_DROP, id, parent });


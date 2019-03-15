import { ID, Item } from "./Item";
import { Tree } from "./tree"
import { EditorState } from "draft-js";
import {
  CREATE,
  EDIT,
  EXPAND,
  FETCH_ALL,
  FOLD,
  LOADED_STATE,
  MOVE_INTO,
  MOVE_INTO_PREV,
  MOVE_UNDER,
  REDO,
  REMOVE,
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
  | MoveUnder
  | MoveIntoPrev


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


export interface MoveUnder {
  type: typeof MOVE_UNDER;
  id: ID;
  parent: ID;
  over: ID;
}


export const moveUnder = (id: ID, parent: ID, over: ID): MoveUnder => (
  { type: MOVE_UNDER, id, over, parent }
);


export interface MoveIntoPrev {
  type: typeof MOVE_INTO_PREV;
  id: ID;
  parent: ID;
}


export const moveIntoPrev = (id: ID, parent: ID): MoveIntoPrev => (
  { type: MOVE_INTO_PREV, id, parent }
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


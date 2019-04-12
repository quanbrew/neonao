import { ID, Item } from './Item';
import { DropPosition, Mode, Tree } from './tree';
import {
  CREATE,
  DROP,
  EDIT,
  EXPAND,
  FOLD,
  GOTO_NEXT,
  GOTO_PREV,
  INDENT,
  LOADED_STATE,
  PATCH,
  REDO,
  REMOVE,
  REORDER,
  START_LOAD,
  SWITCH_MODE,
  TOGGLE,
  UN_INDENT,
  UNDO,
  UPDATE,
  ZOOM,
} from './constants';

export type ListAction = TreeAction | LoadedState | Patch | Undo | Redo;

export type TreeAction =
  | Fold
  | Expand
  | FetchAll
  | Zoom
  | Reorder
  | Create
  | Update
  | Edit
  | Remove
  | Toggle
  | Indent
  | UnIndent
  | SwitchMode
  | GotoNext
  | GotoPrev
  | Drop;

export interface FetchAll {
  type: typeof START_LOAD;
}

export const fetchAll = (): FetchAll => ({ type: START_LOAD });

export interface Remove {
  type: typeof REMOVE;
  id: ID;
}

export const remove = (id: ID): Remove => ({ type: REMOVE, id });

export interface Update {
  type: typeof UPDATE;
  item: Item;
  record: boolean;
}

export const update = (item: Item, record: boolean = false): Update => ({
  type: UPDATE,
  item,
  record,
});

export interface Edit {
  type: typeof EDIT;
  id: ID;
  source: string;
}

export const edit = (id: ID, source: string): Edit => ({
  type: EDIT,
  id,
  source,
});

export interface Create {
  type: typeof CREATE;
  item: Item;
  above?: ID;
}

export const create = (item: Item, above?: ID): Create => ({
  type: CREATE,
  item,
  above,
});

export interface Zoom {
  type: typeof ZOOM;
  id: ID;
}

export const zoom = (id: ID): Zoom => ({ type: ZOOM, id });

export interface Expand {
  type: typeof EXPAND;
  id: ID;
}

export const expand = (id: ID): Expand => ({ type: EXPAND, id });

export interface Fold {
  type: typeof FOLD;
  id: ID;
}

export const fold = (id: ID): Fold => ({ type: FOLD, id });

export interface Toggle {
  type: typeof TOGGLE;
  id: ID;
}

export const toggle = (id: ID): Toggle => ({ type: TOGGLE, id });

export interface Reorder {
  type: typeof REORDER;
  id: ID;
  delta: number;
}

export const reorder = (id: ID, delta: number): Reorder => ({
  type: REORDER,
  id,
  delta,
});

export interface Indent {
  type: typeof INDENT;
  id: ID;
  parent: ID;
}

export const indent = (id: ID, parent: ID): Indent => ({
  type: INDENT,
  id,
  parent,
});

export interface UnIndent {
  type: typeof UN_INDENT;
  id: ID;
  parent: ID;
}

export const unIndent = (id: ID, parent: ID): UnIndent => ({
  type: UN_INDENT,
  id,
  parent,
});

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
  tree: Tree;
}

export const loadedState = (tree: Tree): LoadedState => ({
  type: LOADED_STATE,
  tree,
});

export interface Patch {
  type: typeof PATCH;
  tree: Partial<Tree>;
}

export const patch = (tree: Partial<Tree>): Patch => ({
  type: PATCH,
  tree,
});

export interface SwitchMode {
  type: typeof SWITCH_MODE;
  mode: Mode;
}

export const switchMode = (mode: Mode): SwitchMode => ({
  type: SWITCH_MODE,
  mode,
});

export interface Drop {
  type: typeof DROP;
  id: ID;
  target: ID;
  position: DropPosition;
}

export const drop = (id: ID, target: ID, position: DropPosition): Drop => ({
  type: DROP,
  id,
  target,
  position,
});

export interface GotoNext {
  type: typeof GOTO_NEXT;
  id: ID;
}

export const gotoNext = (id: ID): GotoNext => ({ type: GOTO_NEXT, id });

export interface GotoPrev {
  type: typeof GOTO_PREV;
  id: ID;
}

export const gotoPrev = (id: ID): GotoPrev => ({ type: GOTO_PREV, id });

import { Id, Item } from './Item';
import { Tree } from './tree';
import { DropPosition, Mode, State, View } from './state';
import {
  ADD_VIEW,
  CREATE,
  DROP,
  EDIT,
  EXPAND,
  FOCUS,
  FOLD,
  GOTO_NEXT,
  GOTO_PREV,
  INDENT,
  LOADED_STATE,
  PATCH,
  REDO,
  REMOVE,
  REORDER,
  SET_VIEW,
  SWITCH_MODE,
  TOGGLE,
  UN_INDENT,
  UNDO,
  UPDATE,
} from './constants';

export type Action = TreeAction | LoadedState | Patch | SwitchMode | Undo | Redo | SetView | AddView | Focus;

export type TreeAction =
  | Fold
  | Expand
  | Reorder
  | Create
  | Update
  | Edit
  | Remove
  | Toggle
  | Indent
  | UnIndent
  | GotoNext
  | GotoPrev
  | Drop;

export interface Remove {
  type: typeof REMOVE;
  id: Id;
}

export const remove = (id: Id): Remove => ({ type: REMOVE, id });

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
  id: Id;
  source: string;
}

export const edit = (id: Id, source: string): Edit => ({
  type: EDIT,
  id,
  source,
});

export interface Create {
  type: typeof CREATE;
  item: Item;
  above?: Id;
}

export const create = (item: Item, above?: Id): Create => ({
  type: CREATE,
  item,
  above,
});

export interface Expand {
  type: typeof EXPAND;
  id: Id;
}

export const expand = (id: Id): Expand => ({ type: EXPAND, id });

export interface Fold {
  type: typeof FOLD;
  id: Id;
}

export const fold = (id: Id): Fold => ({ type: FOLD, id });

export interface Toggle {
  type: typeof TOGGLE;
  id: Id;
}

export const toggle = (id: Id): Toggle => ({ type: TOGGLE, id });

export interface Reorder {
  type: typeof REORDER;
  id: Id;
  delta: number;
}

export const reorder = (id: Id, delta: number): Reorder => ({
  type: REORDER,
  id,
  delta,
});

export interface Indent {
  type: typeof INDENT;
  id: Id;
  parent: Id;
}

export const indent = (id: Id, parent: Id): Indent => ({
  type: INDENT,
  id,
  parent,
});

export interface UnIndent {
  type: typeof UN_INDENT;
  id: Id;
  parent: Id;
}

export const unIndent = (id: Id, parent: Id): UnIndent => ({
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
  state: State;
}

export const loadedState = (state: State): LoadedState => ({
  type: LOADED_STATE,
  state,
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
  id: Id;
  target: Id;
  position: DropPosition;
}

export const drop = (id: Id, target: Id, position: DropPosition): Drop => ({
  type: DROP,
  id,
  target,
  position,
});

export interface GotoNext {
  type: typeof GOTO_NEXT;
  id: Id;
}

export const gotoNext = (id: Id): GotoNext => ({ type: GOTO_NEXT, id });

export interface GotoPrev {
  type: typeof GOTO_PREV;
  id: Id;
}

export const gotoPrev = (id: Id): GotoPrev => ({ type: GOTO_PREV, id });

export interface SetView {
  type: typeof SET_VIEW;
  view: View;
}

export const setView = (view: View): SetView => ({ type: SET_VIEW, view });

export interface AddView {
  type: typeof ADD_VIEW;
  view: View;
  order?: number;
}

export const addView = (view: View, order?: number) => ({ type: ADD_VIEW, view, order });

export interface Focus {
  type: typeof FOCUS;
  target: Id;
}

export const focus = (target: Id): Focus => ({ type: FOCUS, target });

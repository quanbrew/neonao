import { Id, Item } from './Item';
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
  | StartLoad
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

export type ViewAction = Zoom;

export interface StartLoad {
  type: typeof START_LOAD;
}

export const startLoad = (): StartLoad => ({ type: START_LOAD });

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

export interface Zoom {
  type: typeof ZOOM;
  id: Id | null;
  push: boolean;
}

export const zoom = (id: Id | null, push: boolean = true): Zoom => ({ type: ZOOM, id, push });

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

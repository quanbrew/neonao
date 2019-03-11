import { ID, Item } from "./Item";
import { Tree } from "./reducers";


export type FETCH_ALL = typeof FETCH_ALL;
export const FETCH_ALL = 'FETCH_ALL';

export interface FetchAll {
  type: FETCH_ALL,
}


export const fetchAll = (): FetchAll => ({ type: FETCH_ALL });

export type REMOVE = typeof REMOVE;
export const REMOVE = 'REMOVE';

export interface Remove {
  type: REMOVE,
  id: ID,
}

export const remove = (id: ID): Remove => ({ type: REMOVE, id });


export type UPDATE = typeof UPDATE;
export const UPDATE = 'UPDATE';

export interface Update {
  type: UPDATE;
  item: Item;
}

export const update = (item: Item): Update => ({ type: UPDATE, item });


export type CREATE = typeof CREATE;
export const CREATE = 'CREATE';


export interface Create {
  type: CREATE;
  item: Item;
  order?: number;
}

export const create = (item: Item, order?: number): Create => (
  { type: CREATE, item, order }
);

export type ZOOM = typeof ZOOM;
export const ZOOM = 'ZOOM';


export interface Zoom {
  type: ZOOM,
  id: ID,
}


export const zoom = (id: ID): Zoom => ({ type: ZOOM, id });


export type EXPAND = typeof EXPAND;
export const EXPAND = 'EXPAND';


export interface Expand {
  type: EXPAND,
  id: ID,
}


export const expand = (id: ID): Expand => ({ type: EXPAND, id });

export type FOLD = typeof FOLD;
export const FOLD = 'FOLD';


export interface Fold {
  type: FOLD,
  id: ID,
}


export const fold = (id: ID): Fold => ({ type: FOLD, id });


export type MOVE = typeof MOVE;
export const MOVE = 'MOVE';

export interface Move {
  id: ID;
  from?: ID;
  to: ID;
  order?: number;
}

export const move = ({ id, parent }: Item, to: ID, order?: number): Move => (
  { id, to, order, from: parent }
);


export type LOADED_STATE = typeof LOADED_STATE;
export const LOADED_STATE = 'LOADED_STATE';

export interface LoadedState {
  type: LOADED_STATE;
  state: Tree;
}


export const loadedState = (state: Tree): LoadedState => (
  { type: LOADED_STATE, state }
);


export type ItemAction =
  | Fold
  | Expand
  | FetchAll
  | Zoom
  | Create
  | Update
  | Remove
  | LoadedState

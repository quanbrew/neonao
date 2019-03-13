import { ID, Item } from "./Item";
import { Tree } from "./tree"
import { Map } from "immutable";
import localForage from "localforage";


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
  record: boolean;
}

export const update = (item: Item, record: boolean = false): Update => ({ type: UPDATE, item, record });


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


export const UNDO = 'UNDO';

export interface Undo {
  type: typeof UNDO;
}

export const undo: Undo = { type: UNDO };

export const REDO = 'REDO';

export interface Redo {
  type: typeof REDO;
}

export const redo: Redo = { type: REDO };

export type LOADED_STATE = typeof LOADED_STATE;
export const LOADED_STATE = 'LOADED_STATE';

export interface LoadedState {
  type: LOADED_STATE;
  state: Partial<Tree>;
}


export const loadedState = (state: Partial<Tree>): LoadedState => (
  { type: LOADED_STATE, state }
);

export type ItemMap = Map<ID, Item>;

const getItemByIDFromStorage = async (id: ID): Promise<Item | null> => {
  const raw = await localForage.getItem<Item.ExportedItem>(id);
  if (raw) {
    let item = Item.fromJSON(raw);
    item.loaded = true;
    return item;
  } else {
    return null;
  }
};

const loadChildren = async (item: Item | null, max_level: number): Promise<ItemMap> => {
  const mapper = async (childID: ID): Promise<ItemMap> => {
    const item = await getItemByIDFromStorage(childID);
    return loadChildren(item, max_level - 1);
  };

  let map: ItemMap = Map();
  if (item) {
    map = map.set(item.id, item);
    if (max_level > 0) {
      const childrenMaps = await Promise.all(item.children.map(mapper));
      return await map.merge(...childrenMaps);
    } else if (item.children.size > 0) {
      item.loaded = false;
    }
  }

  return await map;
};

const createEmptyState = (): LoadedState => {
  const root = Item.create('Hello, this is an empty notebook.');
  const rootID = root.id;
  const map: ItemMap = Map({ [rootID]: root });
  const state = { root: rootID, map, loading: false };
  return loadedState(state);
};

export const loadItemState = async (item: Item, max_level: number = 2): Promise<LoadedState> => {
  let map = await loadChildren(item, max_level);
  map = map.set(item.id, { ...item, loaded: true });
  return await loadedState({ map });
};

export const loadTreeState = async (max_level: number = 128): Promise<LoadedState> => {
  const rootID = await localForage.getItem<ID>('root');
  if (!rootID) return await createEmptyState();
  const root = await getItemByIDFromStorage(rootID);
  const map = await loadChildren(root, max_level);
  console.log('loaded');
  return await loadedState({ root: rootID, map, loading: false });
};


export type ItemAction =
  | Fold
  | Expand
  | FetchAll
  | Zoom
  | Create
  | Update
  | Remove
  | LoadedState
  | Undo
  | Redo

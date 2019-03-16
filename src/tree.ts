import { Map } from "immutable";
import { ID, Item } from "./Item";
import localForage from "localforage";
import { loadedState, LoadedState } from "./actions";
import { DETAIL_MODE, DRAG_MODE, EDIT_NODE, NORMAL_MODE, SELECT_NODE } from "./constants";

export type ItemMap = Map<ID, Item>;

export interface Tree {
  root: ID | null;
  map: ItemMap;
  loading: boolean;
  mode: Mode;
}


export type Mode =
  | EditNode
  | SelectNode
  | DetailMode
  | DragMode
  | NormalMode

export interface NormalMode {
  type: typeof NORMAL_MODE;
}


export const normalMode = (): NormalMode => ({ type: NORMAL_MODE });


export interface WillMoveAt {
  target: ID;
  position: 'above' | 'below';
}

export const willMoveAt = (target: ID, position: WillMoveAt['position']): WillMoveAt => (
  { target, position }
);

export interface DragMode {
  type: typeof DRAG_MODE;
  willMoveAt?: WillMoveAt;
}

export const dragMode = (willMoveAt?: WillMoveAt): DragMode => ({ type: DRAG_MODE, willMoveAt });

export interface EditNode {
  type: typeof EDIT_NODE;
  id: ID;
}


export interface SelectNode {
  type: typeof SELECT_NODE;
  selected: ID[];
  cut: boolean;
}

export interface DetailMode {
  type: typeof DETAIL_MODE;
  id: ID;
}


export const initTree: Tree = { root: null, map: Map(), loading: true, mode: normalMode() };


export const saveTreeState = (state: Tree) => {
  if (!state.root)
    return;
  localForage.setItem('root', state.root).then(() => {
    state.map.forEach(
      (item, key) =>
        localForage.setItem(key, Item.toJSON(item))
    );
    console.debug('saved');
  });
};

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
